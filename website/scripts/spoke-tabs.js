(function () {
  "use strict";

  const root = document.querySelector("[data-threshold-spoke]");
  if (!root) {
    return;
  }

  const shell = document.createElement("nav");
  shell.className = "spoke-access-tabs";
  shell.setAttribute("aria-label", "Spoke access");
  shell.innerHTML = '<a class="spoke-access-tab" href="index.html">Return to Hub</a>';
  root.prepend(shell);
})();
