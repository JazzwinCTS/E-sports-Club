/* ==========================================================================
   about.js — about.html only. Team film playback + gallery hover video
   ========================================================================== */

   $(function () {
    'use strict';

    // ==============================================================
    // 1. TEAM FILM PLAYBACK (Hero Video)
    // ==============================================================

    var video = document.getElementById('aboutVideo');
    var $frame = $('#videoFrame');
    var $playBtn = $('#playVideo');

    if ($playBtn.length && video) {
        $playBtn.on('click', function () {
            $frame.addClass('is-playing');
            video.controls = true;
            $playBtn.hide(); 

            var played = video.play();
            if (played && played.catch) {
                played.catch(function () {
                    $frame.removeClass('is-playing');
                    video.controls = true;
                    $playBtn.show();
                });
            }
        });

        
        $(video).on('play', function () {
            $frame.addClass('is-playing');
            video.controls = true;
            $playBtn.hide();
        });

        $(video).on('pause ended', function () {
            if (video.ended) {
                $frame.removeClass('is-playing');
                video.controls = true;
                $playBtn.show();
                video.controls = true;
            } else if (video.paused && video.currentTime > 0) {
                video.controls = true;
                $playBtn.show();
            }
        });
    }

    // ==============================================================
    // 2. GALLERY HOVER VIDEO
    // ==============================================================

    var hoverCards = document.querySelectorAll('.game-hover');

    hoverCards.forEach(function (card) {
        var videoEl = card.querySelector('.game-video');
        var thumb = card.querySelector('.game-thumb');

        if (!videoEl) return;

        card.addEventListener('mouseenter', function () {
            videoEl.currentTime = 0;
            videoEl.play().catch(function (err) {
                console.log('Video autoplay prevented:', err);
            });
        });

        card.addEventListener('mouseleave', function () {
            videoEl.pause();
        });
        
        videoEl.addEventListener('loadeddata', function () {
            console.log('Video loaded:', videoEl.src);
        });
        
        videoEl.addEventListener('ended', function () {
            videoEl.currentTime = 0;
        });
    });

});
