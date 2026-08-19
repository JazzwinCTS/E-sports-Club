// about.html only. Plays the team film.

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
        // The browser is allowed to refuse autoplay. If it does, leave the controls
        // showing so people can start it themselves.
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
