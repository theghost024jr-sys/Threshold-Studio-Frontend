(function () {
  "use strict";
  const root = document.querySelector("[data-environment]");

  function title(value) {
    return String(value || "Threshold").replace(/-/g, " ").replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function summarize(content) {
    if (!content) return "Choose the next available node.";
    if (typeof content === "string") return content;
    const note = content.note || content;
    return note.excerpt || note.body || note.title || "Choose the next available node.";
  }

  window.ThresholdEnvironment = Object.freeze({
    initialize: function (branch) {
      root.className = "environment";
      root.innerHTML = '<header><p class="fib">Fib 2</p><h1></h1><p class="status">This branch is dormant.</p></header><section hidden><p class="kind"></p><h2></h2><div class="content"></div><div class="choices"></div></section><button type="button" data-enter>Enter branch</button>';
      root.querySelector("h1").textContent = title(branch);
    },
    render: function (node, activate) {
      const section = root.querySelector("section");
      section.hidden = false;
      root.querySelector("[data-enter]").hidden = true;
      root.querySelector(".fib").textContent = "Fib " + String(node.fib || "");
      root.querySelector(".kind").textContent = title(node.kind || "node");
      root.querySelector("h2").textContent = title(node.title || node.id);
      root.querySelector(".content").textContent = (node.components || []).map(function (component) { return title(component.type) + "\n" + summarize(component.content); }).join("\n\n");
      const choices = root.querySelector(".choices");
      choices.replaceChildren();
      (node.children || []).forEach(function (choice) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = choice.label;
        button.addEventListener("click", function () { activate(choice.activation); });
        choices.appendChild(button);
      });
      root.querySelector(".status").textContent = node.children && node.children.length ? "Only immediate children are revealed." : "Active depth reached.";
    },
    status: function (message) { root.querySelector(".status").textContent = message; }
  });
})();