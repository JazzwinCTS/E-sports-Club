(function () {
  'use strict';

  try {
    var savedTheme = JSON.parse(localStorage.getItem('theme')) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
