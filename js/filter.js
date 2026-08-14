/* ==========================================================================
   filter.js — the shared filter bar used on rankings, players and
   tournaments. One implementation so the control behaves and looks identical
   on all three pages (CLAUDE.md section 7: consistency comes from shared files).

   Behaviour follows design-refs/filter.png: a single airy row of controls;
   clicking one flips its chevron to point up and drops its options open.

   Usage:
     NXFilter.init({
       mount: '#rankings-filter',
       controls: [{ key: 'game', label: 'Game', value: 'all', options: [...] }],
       onChange: function (state) { ... }
     });
   ========================================================================== */

var NXFilter = (function ($) {
  'use strict';

  function render(cfg) {
    var $bar = $('<div class="nx-filter"></div>');

    cfg.controls.forEach(function (control) {
      var selected = findOption(control, control.value) || control.options[0];

      var $control = $('<div class="nx-filter__control"></div>')
        .attr('data-key', control.key);

      var $trigger = $(
        '<button type="button" class="nx-filter__trigger" aria-expanded="false" aria-haspopup="listbox">' +
          '<span class="nx-filter__label"></span>' +
          '<span class="nx-filter__value"></span>' +
          '<i class="bi bi-chevron-down nx-filter__chevron" aria-hidden="true"></i>' +
        '</button>'
      );
      $trigger.find('.nx-filter__label').text(control.label);
      $trigger.find('.nx-filter__value').text(selected ? selected.label : '');

      var $menu = $('<div class="nx-filter__menu" role="listbox"></div>');
      control.options.forEach(function (opt) {
        var $opt = $('<button type="button" class="nx-filter__option" role="option"></button>')
          .attr('data-value', opt.value)
          .toggleClass('is-active', opt.value === (selected && selected.value));
        if (opt.icon) {
          $opt.append($('<img alt="">').attr('src', opt.icon));
        }
        $opt.append($('<span></span>').text(opt.label));
        $menu.append($opt);
      });

      $control.append($trigger, $menu);
      $bar.append($control);
    });

    $bar.append('<button type="button" class="nx-filter__reset">Reset</button>');
    $bar.append('<span class="nx-filter__count" aria-live="polite"></span>');

    return $bar;
  }

  function findOption(control, value) {
    var found = null;
    control.options.forEach(function (o) {
      if (o.value === value) { found = o; }
    });
    return found;
  }

  function closeAll($scope) {
    $scope.find('.nx-filter__control').removeClass('is-open')
      .find('.nx-filter__trigger').attr('aria-expanded', 'false');
  }

  return {
    init: function (cfg) {
      var $mount = $(cfg.mount);
      if (!$mount.length) { return null; }

      var state = {};
      cfg.controls.forEach(function (c) {
        state[c.key] = c.value || (c.options[0] && c.options[0].value);
      });

      var $bar = render(cfg);
      $mount.empty().append($bar);

      /* Open / close a single control */
      $bar.on('click', '.nx-filter__trigger', function (e) {
        e.stopPropagation();
        var $control = $(this).closest('.nx-filter__control');
        var wasOpen = $control.hasClass('is-open');
        closeAll($bar);
        if (!wasOpen) {
          $control.addClass('is-open');
          $(this).attr('aria-expanded', 'true');
        }
      });

      /* Pick an option */
      $bar.on('click', '.nx-filter__option', function (e) {
        e.stopPropagation();
        var $opt = $(this);
        var $control = $opt.closest('.nx-filter__control');
        var key = $control.data('key');

        state[key] = $opt.data('value');
        $control.find('.nx-filter__option').removeClass('is-active');
        $opt.addClass('is-active');
        $control.find('.nx-filter__value').text($opt.find('span').text());
        closeAll($bar);

        if (cfg.onChange) { cfg.onChange(state); }
      });

      /* Reset every control to its first option */
      $bar.on('click', '.nx-filter__reset', function () {
        cfg.controls.forEach(function (c) {
          var first = c.options[0];
          state[c.key] = first.value;
          var $control = $bar.find('.nx-filter__control[data-key="' + c.key + '"]');
          $control.find('.nx-filter__value').text(first.label);
          $control.find('.nx-filter__option').removeClass('is-active')
            .filter('[data-value="' + first.value + '"]').addClass('is-active');
        });
        closeAll($bar);
        if (cfg.onChange) { cfg.onChange(state); }
      });

      /* Click outside or press Escape closes any open menu */
      $(document).on('click', function () { closeAll($bar); });
      $(document).on('keydown', function (e) {
        if (e.key === 'Escape') { closeAll($bar); }
      });

      return {
        state: function () { return state; },
        setCount: function (text) { $bar.find('.nx-filter__count').text(text); }
      };
    }
  };
})(jQuery);
