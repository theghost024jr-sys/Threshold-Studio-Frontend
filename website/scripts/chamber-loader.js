(async function () {
  const DIAGNOSTIC_STORAGE_KEY = "threshold.chamber-loader.diagnostics";
  const diagnosticStyles = {
    chamber: "color: #0f766e; font-weight: 700",
    emotion: "color: #b45309; font-weight: 700",
    glyph: "color: #2563eb; font-weight: 700",
    spirit: "color: #7c3aed; font-weight: 700",
    warning: "color: #b91c1c; font-weight: 700"
  };

  function diagnosticsRequested() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("thresholdDiagnostics") === "1") {
      return true;
    }

    try {
      return window.localStorage.getItem(DIAGNOSTIC_STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  let diagnosticsEnabled = diagnosticsRequested();

  function diagnosticLog(channel, message, detail) {
    if (!diagnosticsEnabled) {
      return;
    }

    const label = channel.charAt(0).toUpperCase() + channel.slice(1);
    if (typeof detail === "undefined") {
      console.info(`%c[Loader:${label}]%c ${message}`, diagnosticStyles[channel], "color: inherit");
      return;
    }

    console.info(`%c[Loader:${label}]%c ${message}`, diagnosticStyles[channel], "color: inherit", detail);
  }

  function setDiagnostics(enabled) {
    diagnosticsEnabled = Boolean(enabled);
    try {
      window.localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, diagnosticsEnabled ? "1" : "0");
    } catch (error) {
      // Diagnostics still work for the current page when storage is unavailable.
    }
    return diagnosticsEnabled;
  }

  window.thresholdChamberDiagnostics = Object.freeze({
    enable: function () {
      setDiagnostics(true);
      diagnosticLog("chamber", "Diagnostics enabled");
    },
    disable: function () {
      diagnosticLog("chamber", "Diagnostics disabled");
      setDiagnostics(false);
    },
    status: function () {
      return diagnosticsEnabled;
    }
  });

  window.addEventListener("threshold:glyph-interaction", function (event) {
    diagnosticLog("glyph", "Glyph interaction", event.detail || {});
  });
  window.addEventListener("threshold:emotion-update", function (event) {
    diagnosticLog("emotion", "Emotional state updated", event.detail || {});
  });
  window.addEventListener("threshold:spirit-response", function (event) {
    diagnosticLog("spirit", "Spirit response dispatched", event.detail || {});
  });

  const branch = document.querySelector("[data-branch]");
  if (!branch) {
    diagnosticLog("warning", "No [data-branch] entry marker found");
    return;
  }

  const chamber = branch.dataset.branch;
  if (!chamber) {
    diagnosticLog("warning", "Chamber entry marker has no branch identifier");
    return;
  }

  diagnosticLog("chamber", `Entered ${chamber}`);

  try {
    const archive = await fetch("/data/vault-archive.json", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    });
    const index = await fetch("/data/vault-index.json", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    });

    const identity = (archive && archive[chamber]) || (index && index[chamber]);
    if (!identity) {
      diagnosticLog("warning", `No identity data found for ${chamber}`);
      return;
    }

    diagnosticLog("chamber", `Identity resolved for ${chamber}`, identity);

    if (identity.emotion || identity.emotionalShift) {
      diagnosticLog("emotion", `Emotional data resolved for ${chamber}`, identity.emotion || identity.emotionalShift);
    }
    if (identity.spirit || identity.spiritResponse) {
      diagnosticLog("spirit", `Spirit data resolved for ${chamber}`, identity.spiritResponse || identity.spirit);
    }

    window.dispatchEvent(new CustomEvent("threshold:chamber-identity", {
      detail: identity
    }));

    const title = document.getElementById("chamber-title");
    const lore = document.getElementById("chamber-lore");
    const pulse = document.getElementById("chamber-pulse");

    if (title) {
      title.textContent = identity.name || chamber;
    }
    if (lore) {
      lore.textContent = identity.lore || "No lore available.";
    }
    if (pulse) {
      pulse.textContent = identity.pulse || "—";
    }
  } catch (error) {
    diagnosticLog("warning", `Identity loading failed for ${chamber}`, error);
  }
})();
