const ROUTE_BRANCHES = {
  "ethos-gate": "ethos",
  "mythology-gate": "mythology",
  "wheel-gate": "learningwheel",
  "housegarden-gate": "housegarden",
  "invitation-gate": "invitation"
};

const BRANCHES_DATA_PATH = "data/vault-branches.json";

function normalizeRoute(routeId) {
  return String(routeId || "").toLowerCase().replace(/-gate$/, "").trim();
}

export function createBranchModule(engine) {
  let branchesData = null;
  let branchesPromise = null;

  function loadBranchesData() {
    if (branchesPromise) {
      return branchesPromise;
    }

    if (engine && typeof engine.loadVault === "function") {
      branchesPromise = engine.loadVault("vault-branches")
        .then(function (payload) {
          branchesData = payload && payload.branches ? payload : null;
          return branchesData;
        })
        .catch(function () {
          branchesData = null;
          return null;
        });
      return branchesPromise;
    }

    branchesPromise = fetch(BRANCHES_DATA_PATH, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then(function (payload) {
        branchesData = payload && payload.branches ? payload : null;
        return branchesData;
      })
      .catch(function () {
        branchesData = null;
        return null;
      });

    return branchesPromise;
  }

  function inferBranch(routeId) {
    const staticBranch = ROUTE_BRANCHES[routeId] || normalizeRoute(routeId);
    const nodes = branchesData && branchesData.branches && Array.isArray(branchesData.branches.nodes)
      ? branchesData.branches.nodes
      : [];

    if (!routeId || nodes.length === 0) {
      return staticBranch || "";
    }

    const gateKey = normalizeRoute(routeId);
    const match = nodes.find(function (node) {
      if (!node || !node.id) {
        return false;
      }
      const id = String(node.id).toLowerCase();
      return id === gateKey || id.indexOf(gateKey) !== -1;
    });

    if (match && match.chamber) {
      return String(match.chamber).toLowerCase();
    }

    return staticBranch || "";
  }

  function dispatchBranchUpdate(routeId, branch, selection) {
    if (branch) {
      document.body.dataset.thresholdBranch = branch;
    }

    const nodeCount = branchesData && branchesData.meta && branchesData.meta.nodeCount ? branchesData.meta.nodeCount : 0;
    const edgeCount = branchesData && branchesData.meta && branchesData.meta.edgeCount ? branchesData.meta.edgeCount : 0;

    window.dispatchEvent(new CustomEvent("threshold:branch-update", {
      detail: {
        route: routeId || "",
        branch: branch,
        lore: selection && selection.lore ? selection.lore : "",
        nodeCount: nodeCount,
        edgeCount: edgeCount
      }
    }));
  }

  function apply(routeId, selection) {
    const fallbackBranch = ROUTE_BRANCHES[routeId] || normalizeRoute(routeId) || "";
    dispatchBranchUpdate(routeId, fallbackBranch, selection);

    loadBranchesData().then(function () {
      const resolvedBranch = inferBranch(routeId);
      if (resolvedBranch && resolvedBranch !== fallbackBranch) {
        dispatchBranchUpdate(routeId, resolvedBranch, selection);
      }
    });
  }

  function open(project) {
    const projectKey = normalizeRoute(project);
    const chamber = document.getElementById("project-chamber");
    if (!chamber) {
      return;
    }

    chamber.style.opacity = "0";

    loadBranchesData().then(function () {
      const nodes = branchesData && branchesData.branches && Array.isArray(branchesData.branches.nodes)
        ? branchesData.branches.nodes
        : [];

      const match = nodes.find(function (node) {
        if (!node || !node.id) {
          return false;
        }
        const id = String(node.id).toLowerCase();
        return id === projectKey || id.indexOf(projectKey) !== -1;
      });

      const title = match && match.id ? String(match.id).toUpperCase() : (projectKey || "THRESHOLD").toUpperCase();
      const foundation = match && match.chamber ? String(match.chamber) : "foundation pending";

      window.setTimeout(function () {
        chamber.innerHTML = title + " — " + foundation;
        chamber.style.opacity = "1";
      }, 300);
    });
  }

  loadBranchesData();

  return {
    apply,
    open
  };
}
