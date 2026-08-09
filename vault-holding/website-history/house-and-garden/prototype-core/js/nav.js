(function () {
  "use strict";
  const nav = document.createElement("nav");
  nav.className = "core-nav";
  nav.setAttribute("aria-label", "Anchor navigation");
  nav.innerHTML = '<a href="index.html">Hub</a><a href="housegarden.html">House and Garden</a><a href="ethos.html">Ethos</a><a href="discover.html">Discover</a><a href="invitation.html">Invitation</a>';
  document.body.prepend(nav);
})();