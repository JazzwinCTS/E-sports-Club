/* ==========================================================================
   events.js — events.html only.
   Owns the club activity calendar. Uses sessionStorage `eventView`
   (CLAUDE.md section 5) and calls the Open-Meteo REST API with jQuery.
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
    social:   'bi-people',
    tryout:   'bi-clipboard-check'
  };

  function eventRow(e) {
    var d = new Date(e.date + 'T00:00:00');
    var link = e.linkedTournament
      ? '<a class="nx-btn nx-btn--ghost nx-btn--sm" style="margin-top:12px" ' +
        'href="tournaments.html">View tournament <i class="bi bi-arrow-right"></i></a>'
      : '';

    return '' +
      '<article class="nx-card nx-reveal" style="margin-bottom:12px">' +
        '<div class="nx-row" style="align-items:flex-start;gap:18px;flex-wrap:nowrap">' +
          '<div style="text-align:center;flex-shrink:0;min-width:56px">' +
            '<div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:800;line-height:1">' +
              d.getDate() + '</div>' +
            '<div style="font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)">' +
              d.toLocaleDateString('en-US', { month: 'short' }) + '</div>' +
          '</div>' +
          '<div style="min-width:0;flex:1">' +
            '<div class="nx-row" style="gap:8px;margin-bottom:6px">' +
              '<span class="nx-badge nx-badge--game">' +
                '<i class="bi ' + (TYPE_ICON[e.type] || 'bi-calendar') + '"></i> ' +
                NXRender.esc(e.type) + '</span>' +
              '<span class="nx-muted" style="font-size:.8rem">' +
                NXRender.esc(e.time) + ' · ' + e.durationHours + 'h · ' +
                NXRender.esc(e.location) + '</span>' +
            '</div>' +
            '<h3 style="font-size:1rem;margin-bottom:6px">' + NXRender.esc(e.title) + '</h3>' +
            '<p class="nx-muted nx-mb-0" style="font-size:.86rem">' +
              NXRender.esc(e.description) + '</p>' +
            link +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function calendarView(list) {
    /* Group by month so the calendar view reads differently from the list */
    var months = {};
    list.forEach(function (e) {
      var d = new Date(e.date + 'T00:00:00');
      var key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      (months[key] = months[key] || []).push(e);
    });

    return Object.keys(months).map(function (month) {
      return '' +
        '<div class="nx-reveal" style="margin-bottom:28px">' +
          '<p class="nx-eyebrow">' + NXRender.esc(month) + '</p>' +
          '<div class="nx-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">' +
            months[month].map(function (e) {
              var d = new Date(e.date + 'T00:00:00');
              return '<div class="nx-card" style="padding:14px">' +
                '<div style="font-family:var(--font-heading);font-weight:800;font-size:1.1rem">' +
                  d.getDate() + '</div>' +
                '<div style="font-size:.74rem;color:var(--text-muted);margin-bottom:8px">' +
                  d.toLocaleDateString('en-US', { weekday: 'short' }) + ' · ' +
                  NXRender.esc(e.time) + '</div>' +
                '<div style="font-size:.84rem;font-weight:600">' + NXRender.esc(e.title) + '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
    }).join('');
  }

  function paint() {
    $list.html(view === 'calendar' ? calendarView(events) : events.map(eventRow).join(''));
    $('#viewTabs .nx-tab').removeClass('is-active').attr('aria-selected', 'false')
      .filter('[data-view="' + view + '"]').addClass('is-active').attr('aria-selected', 'true');
  }

  /* ---- Load the schedule ------------------------------------------------ */
  NXRender.load($list, 'data/events.json', function (data) {
    events = data.events;
    venue = data.venue;
    $('#dataNote').text(data._source);
    $('#venueName').text(venue.name);
    paint();
    loadWeather();
  }, 'Loading schedule…');

  $('#viewTabs').on('click', '.nx-tab', function () {
    view = $(this).data('view');
    NXStore.session.set('eventView', view);
    paint();
  });

  /* ---- Live venue forecast (Open-Meteo: free, keyless, CORS-open) --------
     This is the page's RESTful API requirement — a real request over jQuery.
     --------------------------------------------------------------------- */
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
            '</span>' +
            '<span class="nx-trow__v">' +
              Math.round(res.daily.temperature_2m_max[i]) + '° / ' +
              Math.round(res.daily.temperature_2m_min[i]) + '°' +
              ' · ' + res.daily.precipitation_probability_max[i] + '%' +
            '</span>' +
          '</div>';
        }).join('');

        $weather.html(
          '<div style="font-family:var(--font-heading);font-size:2.4rem;font-weight:800;line-height:1;margin:10px 0 4px">' +
            Math.round(res.current.temperature_2m) + '&deg;C' +
          '</div>' +
          '<p class="nx-muted" style="font-size:.84rem">' +
            'Humidity ' + res.current.relative_humidity_2m + '% · ' +
            'Precipitation ' + res.current.precipitation + 'mm' +
          '</p>' +
          '<div style="margin-top:10px">' + days + '</div>'
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
