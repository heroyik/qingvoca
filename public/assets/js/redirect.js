(function () {
  "use strict";

  var destination = "https://heroyik.gitlab.io/qingvoca/";
  var cutoff = new Date(2026, 6, 1);

  function goNow() {
    window.location.replace(destination);
  }

  if (new Date() >= cutoff) {
    goNow();
    return;
  }

  window.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector("[data-redirect-now]");

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        goNow();
      });
    }

    window.setTimeout(goNow, 10000);
  });
})();