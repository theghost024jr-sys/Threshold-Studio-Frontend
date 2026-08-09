(async function () {
  const branch = document.querySelector("[data-branch]");
  if (!branch) {
    return;
  }

  const chamber = branch.dataset.branch;
  if (!chamber) {
    return;
  }

  try {
    const archive = await fetch("/data/vault-archive.json", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    });
    const index = await fetch("/data/vault-index.json", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    });

    const identity = (archive && archive[chamber]) || (index && index[chamber]);
    if (!identity) {
      return;
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
  } catch (err) {
    // Ignore loader failures silently so pages remain usable.
  }
})();
