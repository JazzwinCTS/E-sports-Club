/* ==========================================================================
   about.js — about.html only. Club film playback.
   ========================================================================== */

$(function () {
  'use strict';

  var video = document.getElementById('aboutVideo');
  var $frame = $('#videoFrame');

  $('#playVideo').on('click', function () {
    if (!video) { return; }
    $frame.addClass('is-playing');
    video.controls = true;
    var played = video.play();
    if (played && played.catch) {
      played.catch(function () {
        /* Autoplay policies can refuse — leave the controls visible instead. */
        $frame.removeClass('is-playing');
      });
    }
  });

  if (video) {
    $(video).on('pause ended', function () {
      if (video.ended) { $frame.removeClass('is-playing'); }
    });
  }
});
