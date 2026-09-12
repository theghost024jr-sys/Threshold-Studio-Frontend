import "/scripts/ella-immersive.js";

const notesHost = document.querySelector("[data-ella-notes]");

function renderNotes(markdown) {
  const paragraphs = markdown
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter((block) => block && !block.startsWith("#"))
    .map((block) => {
      const text = block
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\r?\n/g, " ");
      return `<p>${text}</p>`;
    });

  notesHost.innerHTML = paragraphs.join("");
  document.body.dataset.ellaNotesState = "ready";
}

if (notesHost) {
  fetch("/pages/beyond/ella-notes.md")
    .then((response) => {
      if (!response.ok) throw new Error(`Ella notes unavailable: ${response.status}`);
      return response.text();
    })
    .then(renderNotes)
    .catch(() => {
      notesHost.innerHTML = "<p>Ella remains in the outer field.</p>";
      document.body.dataset.ellaNotesState = "fallback";
    });
}