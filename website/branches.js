const ROUTE_BRANCHES = {
  "ethos-gate": "ethos",
  "mythology-gate": "mythology",
  "wheel-gate": "learningwheel",
  "housegarden-gate": "housegarden",
  "invitation-gate": "invitation"
};

function normalizeRoute(routeId) {
  return String(routeId || "").toLowerCase().replace(/-gate$/, "").trim();
}

export function createBranchModule() {
  return {
    apply(routeId, selection) {
      const branch = ROUTE_BRANCHES[routeId] || normalizeRoute(routeId);
      document.body.dataset.thresholdBranch = branch;
      window.dispatchEvent(new CustomEvent("threshold:branch-update", {
        detail: {
          route: routeId || "",
          branch,
          lore: selection && selection.lore ? selection.lore : ""
        }
      }));
    },

    open(project) {
      const chamber = document.getElementById("project-chamber");
      if (chamber) {
        chamber.textContent = normalizeRoute(project).toUpperCase();
      }
    }
  };
}