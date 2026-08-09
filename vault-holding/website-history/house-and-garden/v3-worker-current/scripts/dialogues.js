// DIALOGUES CHAMBER ENGINE
(function () {
  const container = document.getElementById("dialogue-viewer");
  if (!container) return;

  const textBox = container.querySelector(".dialogue-text");
  const optionsBox = container.querySelector(".dialogue-options");

  let currentNode = null;
  let tree = null;

  window.addEventListener("threshold:chamber-identity", (event) => {
    const identity = event.detail;

    tree = identity.dialogue || null;
    currentNode = tree ? tree.start : null;

    renderNode();
  });

  function renderNode() {
    if (!currentNode) return;

    textBox.textContent = currentNode.text || "";

    optionsBox.innerHTML = "";
    (currentNode.options || []).forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "dialogue-option";
      btn.textContent = opt.label;
      btn.onclick = () => {
        currentNode = tree.nodes[opt.next];
        renderNode();
      };
      optionsBox.appendChild(btn);
    });
  }
})();
