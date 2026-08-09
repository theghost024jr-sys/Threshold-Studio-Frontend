(function () {
  "use strict";
  const branch = document.body.dataset.thresholdBranch || "";
  const environment = window.ThresholdEnvironment;
  environment.initialize(branch);

  async function activate(token) {
    environment.status("Activating...");
    try {
      const response = await fetch("/api/nodes/activate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spoke: branch, activation: token })
      });
      if (!response.ok) throw new Error("Activation failed (" + response.status + ")");
      environment.render(await response.json(), activate);
    } catch (error) {
      environment.status(error instanceof Error ? error.message : "Activation failed");
    }
  }

  document.querySelector("[data-enter]").addEventListener("click", function () { activate(branch); });
})();