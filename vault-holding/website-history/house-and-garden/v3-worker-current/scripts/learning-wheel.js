(function () {
  const wheel = document.getElementById("learning-wheel") || document.querySelector(".wheel");
  if (!wheel) {
    return;
  }

  const sectors = Array.from(wheel.querySelectorAll(".wheel-sector, .season-sector"));
  if (!sectors.length) {
    return;
  }

  function updateSeason(season) {
    sectors.forEach(function (el, index) {
      const normalized = String(season || "fog").toLowerCase();
      const opacity = normalized === "storm" ? 0.7 : normalized === "shimmer" ? 0.9 : normalized === "soil" ? 0.5 : 0.8;
      el.style.opacity = String(opacity);
      el.style.transform = "rotate(" + (index * (360 / sectors.length)) + "deg)";
    });
  }

  window.addEventListener("threshold:weather-update", function (event) {
    const detail = event && event.detail ? event.detail : {};
    updateSeason(detail.season || detail.cycle || "fog");
  });

  window.addEventListener("threshold:hub-revealed", function () {
    sectors.forEach(function (el) {
      el.classList.add("sector-visible");
    });
  });

  updateSeason("fog");
})();
