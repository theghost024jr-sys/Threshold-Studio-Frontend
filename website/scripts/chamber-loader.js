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
    const vault = await fetch("/data/threshold-vault.json", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    });

    const identity = vault && Array.isArray(vault.chambers)
      ? vault.chambers.find(function (candidate) {
          const values = [candidate.id, candidate.title, candidate.chamber, candidate.relativePath]
            .filter(Boolean)
            .map(function (value) { return String(value).toLowerCase(); });
          return values.some(function (value) {
            return value === chamber.toLowerCase() || value.includes("/" + chamber.toLowerCase());
          });
        })
      : null;
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
      lore.textContent = identity.body || identity.description || "No lore available.";
    }
    if (pulse) {
      pulse.textContent = identity.category || "vault";
    }
  } catch (err) {
    // Ignore loader failures silently so pages remain usable.
  }
})();
