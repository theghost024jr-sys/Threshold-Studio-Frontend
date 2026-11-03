const reading = document.querySelector("[data-hub-return-reading]");
const continuation = document.querySelector("[data-hub-return-continuation]");

const seamsByOrigin = new Map([
  ["Ocean", ["/portal/deepwater", "Continue into Deepwater"]],
  ["Deepwater", ["/portal/first-door", "Let the First Door open"]],
  ["First Door", ["/portal/motion", "Enter the Motion Field"]],
  ["Mirage", ["/portal/motion", "Enter the Motion Field"]],
  ["Shore", ["/portal/ocean", "Face the Ocean"]],
  ["Ruins", ["/portal/quiet-grove", "Find the Quiet Grove"]],
  ["Quiet Grove", ["/portal/motion", "Resume through Motion"]],
  ["Spiral Grove", ["/portal/quiet-grove", "Find the Quiet Grove"]],
  ["Doug", ["/portal/motion", "Follow the cleared vector"]],
]);

function readReturnState() {
  try {
    const state = JSON.parse(sessionStorage.getItem("threshold-return-state") || "null");
    return state?.origin && state?.value && state?.detail ? state : null;
  } catch (error) {
    console.warn("Threshold Return state could not be restored.", error);
    return null;
  }
}

const state = readReturnState();

if (state && reading && continuation) {
  const [href, label] = seamsByOrigin.get(state.origin) || ["/portal/ocean", "Return to the Ocean"];
  reading.textContent = `${state.origin} returns as ${state.value}. ${state.detail}`;
  continuation.href = href;
  continuation.textContent = label;
}
