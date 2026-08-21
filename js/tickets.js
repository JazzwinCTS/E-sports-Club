/* ========================================================================
   tickets.js — Event rendering, step flow, dynamic pricing & Stripe payment
   ======================================================================== */

$(function () {
    'use strict';

    var currentUnitPrice = 35;
    var currentEvent = null;
    var loadedEvents = {};

    var imageMap = {
        'valorant': 'GameArt/valorant-profile.jpg',
        'cs2': 'GameArt/cs2-profile.png',
        'pubg': 'GameArt/pubg-profile.jpg'
    };

    function parseTournamentDate(dateStr, timeStr) {
        var timeParts = timeStr ? timeStr.match(/(\d+):(\d+)\s(AM|PM)/i) : null;
        var hours = 0;
        var minutes = 0;

        if (timeParts) {
            hours = parseInt(timeParts[1], 10);
            minutes = parseInt(timeParts[2], 10);
            if (timeParts[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
            if (timeParts[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
        }

        var d = new Date(dateStr + " 2026");
        d.setHours(hours, minutes, 0, 0);
        return d;
    }

    function formatDisplayDate(dateObj) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var day = dateObj.getDate().toString().padStart(2, '0');
        var month = months[dateObj.getMonth()];
        var year = dateObj.getFullYear();
        return day + " " + month + " " + year;
    }

    function formatDisplayTime(dateObj) {
        var hours = dateObj.getHours().toString().padStart(2, '0');
        var minutes = dateObj.getMinutes().toString().padStart(2, '0');
        return hours + ":" + minutes + " MYT";
    }

    // 1. Fetch & Render Cards
    function loadAndRenderTickets() {
        var $container = $('#ticketContainer');

        $.getJSON('data/youth-tournament.json', function (data) {
            var allEvents = [];

            // Valorant & CS2 (RM 35)
            ['valorant', 'cs2'].forEach(function (gameKey) {
                var gameData = data.championship && data.championship.games ? data.championship.games[gameKey] : null;
                if (gameData && gameData.matches) {
                    gameData.matches.forEach(function (match) {
                        if (match.status === 'upcoming') {
                            var eventDate = parseTournamentDate(match.date, match.time);
                            var eventObj = {
                                id: match.id,
                                category: gameKey,
                                gameName: gameData.label,
                                image: imageMap[gameKey],
                                qrImage: 'TicketsQR/' + match.id + '.jpg',
                                stage: match.round,
                                dateObj: eventDate,
                                displayDate: formatDisplayDate(eventDate) + " · " + formatDisplayTime(eventDate),
                                dateOnly: formatDisplayDate(eventDate),
                                timeOnly: formatDisplayTime(eventDate),
                                venue: 'Bukit Jalil Stadium',
                                price: 35
                            };
                            allEvents.push(eventObj);
                            loadedEvents[match.id] = eventObj;
                        }
                    });
                }
            });

            // PUBG (Grouped 5-Round Championship Pass)
            var pubgData = data.championship && data.championship.games ? data.championship.games.pubg : null;
            if (pubgData && pubgData.rounds && pubgData.rounds.length > 0) {
                var upcomingRounds = pubgData.rounds.filter(function (round) {
                    return round.status === 'upcoming';
                });

                if (upcomingRounds.length > 0) {
                    var firstRound = upcomingRounds[0];
                    var eventDate = parseTournamentDate(firstRound.date, firstRound.time);
                    var pubgPassObj = {
                        id: 'pubg-5-rounds-pass',
                        category: 'pubg',
                        gameName: pubgData.label,
                        image: imageMap['pubg'],
                        qrImage: 'TicketsQR/pubg-qr.jpg',
                        stage: '5-Round Competition Pass (Rounds 1–5)',
                        dateObj: eventDate,
                        displayDate: formatDisplayDate(eventDate) + " · Full 5-Round Match",
                        dateOnly: formatDisplayDate(eventDate),
                        timeOnly: formatDisplayTime(eventDate),
                        venue: 'Bukit Jalil Stadium',
                        price: 35
                    };
                    allEvents.push(pubgPassObj);
                    loadedEvents[pubgPassObj.id] = pubgPassObj;
                }
            }

            var now = new Date();
            var upcomingEvents = allEvents
                .filter(function (ev) { return ev.dateObj > now; })
                .sort(function (a, b) { return a.dateObj - b.dateObj; });

            $container.empty();

            if (upcomingEvents.length === 0) {
                $container.html('<div class="nx-empty" style="grid-column: 1 / -1; padding: 40px; text-align: center;"><h3 class="nx-h3">NO UPCOMING EVENTS</h3></div>');
                return;
            }

            var htmlString = '';
            upcomingEvents.forEach(function (event) {
                htmlString += `
                    <div class="ticket-card" data-category="${event.category}">
                        <div class="ticket-card__media">
                            <img src="${event.image}" alt="${event.gameName} Event" class="ticket-card__art">
                            <div class="ticket-card__overlay-text">${event.gameName}</div>
                        </div>
                        <div class="ticket-card__content">
                            <h3 class="ticket-card__stage">${event.stage}</h3>
                            <div class="ticket-card__detail">
                                <i class="bi bi-calendar-event"></i>
                                <span>${event.displayDate}</span>
                            </div>
                            <div class="ticket-card__detail">
                                <i class="bi bi-geo-alt"></i>
                                <span>${event.venue}</span>
                            </div>
                            <div class="ticket-card__actions">
                                <button type="button" class="nx-btn nx-btn--primary nx-btn--block buy-ticket-btn" data-event-id="${event.id}">Buy Ticket</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            $container.append(htmlString);
        });
    }

    loadAndRenderTickets();

    // 2. Tab Filtering
    $('#ticketFilter').on('click', '.nx-tab', function () {
        var selectedCategory = $(this).data('filter');
        $('#ticketFilter .nx-tab').removeClass('is-active').attr('aria-selected', 'false');
        $(this).addClass('is-active').attr('aria-selected', 'true');

        if (selectedCategory === 'all') {
            $('.ticket-card').fadeIn(200);
        } else {
            $('.ticket-card').hide();
            $('.ticket-card[data-category="' + selectedCategory + '"]').fadeIn(200);
        }

        var sectionTop = $('#tickets').offset().top - 90;
        $('html, body').animate({ scrollTop: sectionTop }, 400);
    });

    // 3. Open Modal Flow (Step 1)
    $('#ticketContainer').on('click', '.buy-ticket-btn', function () {
        var eventId = $(this).data('event-id');
        currentEvent = loadedEvents[eventId];

        if (!currentEvent) return;

        $('#ticketSuccessView').hide();
        $('#modalStep2').removeClass('is-active').removeAttr('style');
        $('#modalStep1').addClass('is-active').removeAttr('style');

        $('#modalGameArt').attr('src', currentEvent.image);
        $('#modalCompetitionName').text(currentEvent.gameName + ' — ' + currentEvent.stage);

        $('#modalDate').text(currentEvent.dateOnly);
        $('#modalTime').text(currentEvent.timeOnly);
        $('#modalVenue').text(currentEvent.venue);

        currentUnitPrice = currentEvent.price;
        $('#modalUnitPrice').text(currentUnitPrice);

        var mapSearchQuery = encodeURIComponent(currentEvent.venue + ", Malaysia");
        var mapEmbedUrl = 'https://maps.google.com/maps?q=' + mapSearchQuery + '&t=&z=15&ie=UTF8&iwloc=&output=embed';
        $('#modalMapFrame').attr('src', mapEmbedUrl);

        $('#ticketQty').val(1);
        updateTotalPrice(1);

        $('#ticketModal').addClass('is-open').attr('aria-hidden', 'false');
        $('body').css('overflow', 'hidden');
    });

    // 4. Stepper & Price Calculation
    function updateTotalPrice(qty) {
        var total = qty * currentUnitPrice;
        $('.ticket-modal__total-price').html('RM ' + total);
        $('.ticket-summary__grand-total').html('<small style="font-size: 0.45em; font-weight: 700; margin-right: 4px; vertical-align: middle;">RM</small> ' + total);
        $('#confirmPayBtn').html('Pay <small style="font-size: 0.7em;">RM ' + total + '</small>');
    }

    $('#qtyPlus').on('click', function () {
        var $input = $('#ticketQty');
        var val = parseInt($input.val(), 10) || 1;
        if (val < 10) {
            val++;
            $input.val(val);
            updateTotalPrice(val);
        }
    });

    $('#qtyMinus').on('click', function () {
        var $input = $('#ticketQty');
        var val = parseInt($input.val(), 10) || 1;
        if (val > 1) {
            val--;
            $input.val(val);
            updateTotalPrice(val);
        }
    });

    // 5. Navigate to Step 2 (Payment Step) — Enforces User Sign In First
    $('#goToPaymentBtn').on('click', function () {
        if (!currentEvent) return;

        var isLoggedIn = typeof NXStore !== 'undefined' && NXStore.session && NXStore.session.get('isLoggedIn') === true;

        if (!isLoggedIn) {
            alert('Please sign in to your account before proceeding to payment.');
            window.location.href = 'signin.html';
            return;
        }

        var qty = $('#ticketQty').val();

        $('#summaryTitle').text(currentEvent.gameName + ' — ' + currentEvent.stage);
        $('#summaryDateTime').text(currentEvent.dateOnly + ' @ ' + currentEvent.timeOnly);
        $('#summaryVenue').text(currentEvent.venue);
        $('#summaryQty').text(qty);

        $('#modalStep1').removeClass('is-active');
        $('#modalStep2').addClass('is-active');
    });

    // Back to Step 1
    $('#backToStep1Btn').on('click', function () {
        $('#modalStep2').removeClass('is-active');
        $('#modalStep1').addClass('is-active');
    });

    // Inputs Auto-formatting
    $('#stripeCardNumber').on('input', function () {
        var val = $(this).val().replace(/\D/g, '').substring(0, 16);
        var formatted = val.match(/.{1,4}/g) ? val.match(/.{1,4}/g).join(' ') : '';
        $(this).val(formatted);
    });

    $('#stripeCardExpiry').on('input', function () {
        var val = $(this).val().replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
            $(this).val(val.substring(0, 2) + '/' + val.substring(2));
        } else if (val.length === 2 && $(this).data('oldVal') && $(this).data('oldVal').length < val.length) {
            $(this).val(val + '/');
        } else {
            $(this).val(val);
        }
        $(this).data('oldVal', val);
    });

    $('#stripeCardCvc').on('input', function () {
        var val = $(this).val().replace(/\D/g, '').substring(0, 4);
        $(this).val(val);
    });

    // Save newly purchased tickets to localStorage
    function storeTicketPurchase(eventData) {
        if (typeof NXStore === 'undefined') return false;

        var regs = NXStore.local.get('registrations', []) || [];
        var currentUser = regs.length ? regs[regs.length - 1] : null;

        if (!currentUser) {
            alert('Please sign in before purchasing tickets.');
            return false;
        }

        var qty = parseInt($('#ticketQty').val(), 10) || 1;
        var allTickets = NXStore.local.get('userTickets', []) || [];

        for (var i = 0; i < qty; i++) {
            var newTicket = {
                id: 'TCK-' + Math.floor(100000 + Math.random() * 900000),
                userEmail: currentUser.email,
                title: eventData.gameName ? (eventData.gameName + ' — ' + eventData.stage) : (eventData.title || 'Tournament Pass'),
                game: eventData.category || eventData.game || 'cs2',
                date: eventData.displayDate || eventData.date || 'TBD',
                venue: eventData.venue || 'Main Stage',
                type: 'Standard Pass',
                status: 'valid',
                poster: eventData.image || eventData.poster || 'assets/images/events/default.jpg',
                purchasedAt: new Date().toISOString()
            };
            allTickets.push(newTicket);
        }

        NXStore.local.set('userTickets', allTickets);
        return true;
    }

    // DISPLAY QR TICKET VIEW AFTER SUCCESSFUL PAYMENT
    function showSuccessTicketView() {
        if (!storeTicketPurchase(currentEvent)) {
            return;
        }

        var qty = parseInt($('#ticketQty').val(), 10) || 1;
        var randomCode = Math.floor(10000 + Math.random() * 90000);

        $('#passGameName').text(currentEvent.gameName || 'Esports Match');
        $('#passStage').text(currentEvent.stage || 'Championship');
        $('#passDate').text(currentEvent.dateOnly || 'TBD');
        $('#passTime').text(currentEvent.timeOnly || 'TBD');
        $('#passVenue').text(currentEvent.venue || 'Main Stage');
        $('#passQty').text(qty + ' Ticket(s)');
        $('#passCode').text(randomCode);

        var passImage = currentEvent.image || imageMap[currentEvent.category];
        if (passImage) {
            $('#ticketPassCard').css({
                'background-image': 'url(' + passImage + ')',
                'background-size': 'cover',
                'background-position': 'center'
            });
        }

        var categoryQrMap = {
            'valorant': 'TicketsQR/valorant-qr.jpg',
            'cs2': 'TicketsQR/cs2-qr.jpg',
            'pubg': 'TicketsQR/pubg-qr.jpg'
        };

        var fallbackQr = categoryQrMap[currentEvent.category] || 'TicketsQR/valorant-qr.jpg';
        var primaryQr = currentEvent.qrImage || fallbackQr;

        var $qrImg = $('#passQrImg');

        $qrImg.off('error').on('error', function () {
            $(this).attr('src', fallbackQr);
        });

        $qrImg.attr('src', primaryQr);

        $('#modalStep1, #modalStep2').removeClass('is-active').hide();
        $('#ticketSuccessView').fadeIn(200);
    }

    // 6. Backend REST API Payment Submission Handler
    $('#confirmPayBtn').on('click', function () {
        var $btn = $(this);
        var originalText = $btn.html();

        var cardNumber = $('#stripeCardNumber').val().replace(/\s+/g, '');
        var expiry = $('#stripeCardExpiry').val().split('/');
        var expMonth = expiry[0] ? expiry[0].trim() : '';
        var expYear = expiry[1] ? expiry[1].trim() : '';
        var cvc = $('#stripeCardCvc').val().trim();
        var qty = parseInt($('#ticketQty').val(), 10) || 1;
        var totalAmountRM = qty * currentUnitPrice;
        var totalAmountCents = totalAmountRM * 100;

        if (!cardNumber || !expMonth || !expYear || !cvc) {
            alert('Please complete all card details before submitting payment.');
            return;
        }

        $btn.prop('disabled', true).html('<i class="bi bi-arrow-repeat spin"></i> Processing Payment...');

        $.ajax({
            url: 'https://nextgen-e-sports-club.onrender.com/api/pay',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                cardNumber: cardNumber,
                expMonth: expMonth,
                expYear: expYear,
                cvc: cvc,
                amountCents: totalAmountCents,
                description: 'Ticket Purchase: ' + currentEvent.gameName + ' - ' + currentEvent.stage
            }),
            success: function (response) {
                $btn.prop('disabled', false).html(originalText);

                if (response.success && response.status === 'succeeded' && response.paid) {
                    showSuccessTicketView();
                } else {
                    alert('Payment Status: ' + (response.status || 'Failed'));
                }
            },
            error: function (jqXHR) {
                $btn.prop('disabled', false).html(originalText);
                var err = (jqXHR.responseJSON && jqXHR.responseJSON.error)
                    ? jqXHR.responseJSON.error.message
                    : 'Payment request failed.';

                alert('Payment Error: ' + err);
            }
        });
    });

    // Complete Button Handler
    $(document).on('click', '#completeTicketBtn', function () {
        closeModal();
    });

    // 7. Close Modal Logic
    function closeModal() {
        $('#ticketModal').removeClass('is-open').attr('aria-hidden', 'true');
        $('#modalMapFrame').attr('src', '');
        $('body').css('overflow', '');

        setTimeout(function () {
            $('#ticketSuccessView').hide();
            $('#modalStep2').removeClass('is-active').removeAttr('style');
            $('#modalStep1').addClass('is-active').removeAttr('style');
        }, 300);
    }

    $('#closeModalBtn, #modalBackdrop').on('click', closeModal);

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#ticketModal').hasClass('is-open')) {
            closeModal();
        }
    });

});