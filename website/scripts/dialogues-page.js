(function () {
  const text = document.querySelector(".dialogue-text");
  const options = Array.from(document.querySelectorAll("[data-dialogue]"));
  const responses = {
    listen: "The chamber quiets. A second voice becomes audible beneath the first.",
    name: "What is named does not become owned. It becomes possible to meet.",
    return: "The signal leaves changed by the fact that you carried it."
  };

  options.forEach((option) => {
    option.addEventListener("click", () => {
      text.textContent = responses[option.dataset.dialogue];
      options.forEach((item) => item.setAttribute("aria-pressed", String(item === option)));
    });
  });

  document.querySelectorAll("[data-portal]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input");
      const response = form.parentElement.querySelector(".portal-response");
      const value = input.value.trim();
      if (!value) return;
      const wordCount = value.split(/\s+/).length;
      response.textContent = form.dataset.portal === "arrival"
        ? `${wordCount} words entered the chamber. The branch is listening.`
        : "The sentence has returned as a trace. Nothing was published.";
      input.value = "";
    });
  });
})();