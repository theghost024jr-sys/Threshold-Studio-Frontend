const gateway = document.querySelector(".beyond-shell");

if (gateway) {
  gateway.dataset.beyondState = "open";
  window.dispatchEvent(new CustomEvent("threshold:beyond-opened", {
    detail: { source: "hub", layer: "outer-field" }
  }));
}