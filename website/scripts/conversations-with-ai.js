// Reading modes for the Conversations With AI archive.
// Presentation only: the full document is always in the markup, and without
// JavaScript both registers remain visible.
(() => {
  const buttons = document.querySelectorAll("[data-archive-mode]");
  if (!buttons.length) return;

  const setMode = (mode) => {
    document.body.dataset.archiveView = mode;
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.archiveMode === mode));
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => setMode(button.dataset.archiveMode));
  }
})();
