const gateway = document.querySelector("[data-beyond-gateway]");

if (gateway) {
  gateway.dataset.beyondState = "open";
  window.dispatchEvent(new CustomEvent("threshold:beyond-opened", {
    detail: { source: "hub", layer: "outer-field" }
  }));
}