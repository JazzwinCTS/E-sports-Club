/* ==========================================================================
   events.js — events.html only.
   Owns the team activity calendar. Uses sessionStorage `eventView`
   and calls the Open-Meteo REST API with jQuery.
   ========================================================================== */

$(function () {
    'use strict';

    var $list = $('#eventList');
    var events = [];
    var venue = null;
    var view = NXStore.session.get('eventView', 'list') || 'list';

    var TYPE_ICON = {
        practice: 'bi-controller',
        workshop: 'bi-mortarboard',
        social: 'bi-people',
        tryout: 'bi-clipboard-check'
    };

    // ============================================================
    //  Check event status (past / today / upcoming)
    // ============================================================
    function getEventStatus(eventDate) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var evDate = new Date(eventDate + 'T00:00:00');
        evDate.setHours(0, 0, 0, 0);

        var diffTime = evDate.getTime() - today.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return 'past';
        } else if (diffDays === 0) {
            return 'today';
        } else {
            return 'upcoming';
        }
    }

    // ============================================================
    //  Get status label HTML
    // ============================================================
    function getStatusBadge(status) {
        if (status === 'past') {
            return '<span class="nx-badge ev-badge--past"><i class="bi bi-check-circle"></i> Past</span>';
        } else if (status === 'today') {
            return '<span class="nx-badge ev-badge--today"><i class="bi bi-calendar-check"></i> Today</span>';
        } else {
            return '<span class="nx-badge ev-badge--upcoming"><i class="bi bi-clock"></i> Upcoming</span>';
        }
    }

    // ============================================================
    //  eventRow - Includes an expandable details feature
    // ============================================================

    function eventRow(e) {
        var d = new Date(e.date + 'T00:00:00');
        var status = getEventStatus(e.date);

        var statusClass = '';
        if (status === 'past') {
            statusClass = ' ev-row--past';
        } else if (status === 'today') {
            statusClass = ' ev-row--today';
        }

        var detailId = 'detail-' + e.id.replace(/[^a-zA-Z0-9]/g, '-');

        var link = e.linkedTournament
            ? '<a class="nx-btn nx-btn--ghost nx-btn--sm ev-row__link" ' +
            'href="tournaments.html">View tournament <i class="bi bi-arrow-right"></i></a>'
            : '';

        var gameName = e.game || 'TBD';

        var timeDisplay = e.time || 'TBD';

        return '' +
            '<article class="nx-card nx-reveal ev-row' + statusClass + '">' +
            '<div class="ev-row__inner d-flex flex-nowrap align-items-start">' +
            '<div class="ev-row__date">' +
            '<div class="ev-row__day">' + d.getDate() + '</div>' +
            '<div class="ev-row__month">' +
            d.toLocaleDateString('en-US', { month: 'short' }) + '</div>' +
            '</div>' +
            '<div class="ev-row__body">' +
            '<div class="ev-row__meta d-flex flex-wrap align-items-center">' +
            '<span class="nx-badge nx-badge--game">' +
            '<i class="bi ' + (TYPE_ICON[e.type] || 'bi-calendar') + '"></i> ' +
            NXRender.esc(e.type) + '</span>' +
            getStatusBadge(status) +
            '</div>' +
            '<h3 class="ev-row__title">' + NXRender.esc(e.title) + '</h3>' +
            '<p class="nx-muted nx-mb-0 ev-row__desc">' +
            NXRender.esc(e.description) + '</p>' +

            // ============================================================
            // Expand details button
            // ============================================================
            '<button class="nx-btn nx-btn--sm nx-btn--ghost ev-detail-toggle" ' +
            'data-target="' + detailId + '" ' +
            'style="margin-top:12px; font-size:0.7rem;">' +
            '<i class="bi bi-chevron-down"></i> Show Details' +
            '</button>' +

            // ============================================================
            // Details Area (hidden by default) - Show all details
            // ============================================================
            '<div id="' + detailId + '" class="ev-detail" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.85rem;">' +
            '<div><span class="nx-muted">📍 Location:</span> ' + NXRender.esc(e.location) + '</div>' +
            '<div><span class="nx-muted">⏰ Time:</span> ' + NXRender.esc(timeDisplay) + '</div>' +
            '<div><span class="nx-muted">⏱️ Duration:</span> ' + e.durationHours + ' hours</div>' +
            '<div><span class="nx-muted">📅 Date:</span> ' + d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + '</div>' +
            '<div><span class="nx-muted">🎮 Game:</span> ' + NXRender.esc(gameName) + '</div>' +

            '</div>' +
            (e.linkedTournament ? '<div style="margin-top:10px;"><span class="nx-muted">🏆 Tournament:</span> ' + NXRender.esc(e.linkedTournament) + '</div>' : '') +
            '</div>' +

            link +
            '</div>' +
            '</div>' +
            '</article>';
    }

    // ============================================================
    //  calendarView - Added status colors
    // ============================================================
    function calendarView(list) {
        var months = {};
        list.forEach(function (e) {
            var d = new Date(e.date + 'T00:00:00');
            var key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!months[key]) {
                months[key] = [];
            }
            months[key].push(e);
        });

        return Object.keys(months).map(function (month) {
            return '' +
                '<div class="nx-reveal ev-cal">' +
                '<p class="nx-eyebrow">' + NXRender.esc(month) + '</p>' +
                '<div class="ev-cal__grid">' +
                months[month].map(function (e) {
                    var d = new Date(e.date + 'T00:00:00');
                    var status = getEventStatus(e.date);

                    var statusColor = '';
                    var statusLabel = '';
                    if (status === 'past') {
                        statusColor = 'opacity:0.5;';
                        statusLabel = '<div style="font-size:0.55rem;color:var(--text-muted);margin-top:4px;">✓ Past</div>';
                    } else if (status === 'today') {
                        statusColor = 'border-color:var(--gold);background:var(--accent-soft);';
                        statusLabel = '<div style="font-size:0.55rem;color:var(--gold);margin-top:4px;font-weight:700;">⬤ Today</div>';
                    } else {
                        statusLabel = '<div style="font-size:0.55rem;color:var(--upcoming);margin-top:4px;">⏳ Upcoming</div>';
                    }

                    return '<div class="nx-card ev-cal__day" style="' + statusColor + '">' +
                        '<div class="ev-cal__daynum">' + d.getDate() + '</div>' +
                        '<div class="ev-cal__daymeta">' +
                        d.toLocaleDateString('en-US', { weekday: 'short' }) + ' · ' +
                        NXRender.esc(e.time) + '</div>' +
                        '<div class="ev-cal__title">' + NXRender.esc(e.title) + '</div>' +
                        statusLabel +
                        '</div>';
                }).join('') +
                '</div>' +
                '</div>';
        }).join('');
    }

    // ============================================================
    //  paint – Sorting: upcoming items first
    // ============================================================
    function paint() {
        var sortedEvents = events.slice().sort(function (a, b) {
            var statusA = getEventStatus(a.date);
            var statusB = getEventStatus(b.date);

            if (statusA === 'past' && statusB !== 'past') return 1;
            if (statusA !== 'past' && statusB === 'past') return -1;
            return new Date(a.date) - new Date(b.date);
        });

        $list.html(view === 'calendar' ? calendarView(sortedEvents) : sortedEvents.map(eventRow).join(''));
        $('#viewTabs .nx-tab').removeClass('is-active').attr('aria-selected', 'false')
            .filter('[data-view="' + view + '"]').addClass('is-active').attr('aria-selected', 'true');
    }

    // ============================================================
    //  Expand/Collapse Details - Click Event
    // ============================================================
    $(document).on('click', '.ev-detail-toggle', function () {
        var targetId = $(this).data('target');
        var $detail = $('#' + targetId);
        var $btn = $(this);

        if ($detail.is(':visible')) {
            $detail.slideUp(200);
            $btn.html('<i class="bi bi-chevron-down"></i> Show Details');
        } else {
            $detail.slideDown(200);
            $btn.html('<i class="bi bi-chevron-up"></i> Hide Details');
        }
    });

    /* ---- Load the schedule ------------------------------------------------ */
    NXRender.load($list, 'data/events.json', function (data) {
        events = data.events;
        venue = data.venue;
        $('#venueName').text(venue.name);
        paint();
        loadWeather();
    }, 'Loading schedule…');

    $('#viewTabs').on('click', '.nx-tab', function () {
        view = $(this).data('view');
        NXStore.session.set('eventView', view);
        paint();
    });

    /* ---- Live venue forecast (Open-Meteo) --------------------------------- */
    function loadWeather() {
        var $weather = $('#weather');

        $.ajax({
            url: 'https://api.open-meteo.com/v1/forecast',
            method: 'GET',
            dataType: 'json',
            timeout: 8000,
            data: {
                latitude: venue.latitude,
                longitude: venue.longitude,
                current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code',
                daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                timezone: venue.timezone,
                forecast_days: 4
            },
            beforeSend: function () {
                $weather.html(NXRender.spinner('Fetching forecast…'));
            },
            success: function (res) {
                if (!res || !res.current) {
                    $weather.html('<p class="nx-muted nx-mb-0">Forecast unavailable.</p>');
                    return;
                }

                var days = res.daily.time.map(function (day, i) {
                    var d = new Date(day + 'T00:00:00');
                    return '<div class="nx-trow">' +
                        '<span class="nx-trow__k">' +
                        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
                        ' &nbsp; ' +
                        '</span>' +
                        '<span class="nx-trow__v">' +
                        Math.round(res.daily.temperature_2m_max[i]) + '° / ' +
                        Math.round(res.daily.temperature_2m_min[i]) + '°' +
                        ' · ' + res.daily.precipitation_probability_max[i] + '%' +
                        '</span>' +
                        '</div>';
                }).join('');

                $weather.html(
                    '<div class="ev-weather__temp">' +
                    Math.round(res.current.temperature_2m) + '&deg;C' +
                    '</div>' +
                    '<p class="nx-muted ev-weather__meta">' +
                    'Humidity ' + res.current.relative_humidity_2m + '% · ' +
                    'Precipitation ' + res.current.precipitation + 'mm' +
                    '</p>' +
                    '<div class="ev-weather__days">' + days + '</div>'
                );
            },
            error: function () {
                $weather.html(
                    '<p class="nx-muted nx-mb-0" style="font-size:.86rem">' +
                    'Could not reach the forecast service. Check your connection and reload.' +
                    '</p>'
                );
            }
        });
    }
});
