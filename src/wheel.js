import { buildWheelRouter } from "./wheel-router.js";

function renderGallery(container, records = []) {
  container.replaceChildren();

  records.forEach((record) => {
    const item = document.createElement("article");
    item.className = "wheel-item";

    if (record.image) {
      const image = document.createElement("img");
      image.src = `/learning-wheel/${record.image}`;
      image.alt = record.title;
      item.appendChild(image);
    }

    const title = document.createElement("h3");
    title.textContent = record.title;
    item.appendChild(title);

    const body = document.createElement("div");
    body.className = "wheel-item-body";
    body.innerHTML = record.body;
    item.appendChild(body);

    container.appendChild(item);
  });
}

function initializeWheel(bundle) {
  const tabs = Array.from(document.querySelectorAll("#wheel-tabs button"));
  const galleries = Array.from(document.querySelectorAll(".wheel-tab"));

  if (tabs.length === 0 || galleries.length === 0) {
    return;
  }

  const router = buildWheelRouter(bundle);

  function showTab(tabName) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.tab === tabName;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });

    galleries.forEach((gallery) => {
      const selected = gallery.id === `${tabName}-gallery`;
      gallery.hidden = !selected;
      if (selected) {
        renderGallery(gallery, router[tabName] || []);
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  });

  showTab("sprout");
}

function startWheel() {
  if (window.thresholdBundle) {
    initializeWheel(window.thresholdBundle);
    return;
  }

  window.addEventListener("threshold:engine-ready", () => {
    if (window.thresholdBundle) {
      initializeWheel(window.thresholdBundle);
    }
  }, { once: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWheel, { once: true });
} else {
  startWheel();
}
