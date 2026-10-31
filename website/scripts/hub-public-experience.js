const page = document.body;
const core = document.getElementById("hub-awaken");
const reading = document.getElementById("hub-return-reading");
const continueRoute = document.getElementById("hub-continue-route");
const continueLabel = document.getElementById("hub-continue-label");
const continueDetail = document.getElementById("hub-continue-detail");
const returnStateKey = "threshold-return-state";

const returnStates = [
  "Motion returns as vector. The field begins to turn with you.",
  "Depth returns as pressure. The Hub holds it without a story.",
  "A stance has reached the core. The next seam is visible because you are."
];

function updateParallax(event) {
  const horizontal = (event.clientX / window.innerWidth - 0.5) * 2;
  const vertical = (event.clientY / window.innerHeight - 0.5) * 2;
  page.style.setProperty("--hub-pointer-x", horizontal.toFixed(3));
  page.style.setProperty("--hub-pointer-y", vertical.toFixed(3));
}

function currentReturnState() {
  const rawState = sessionStorage.getItem(returnStateKey);
  if (!rawState) return null;

  try {
    const state = JSON.parse(rawState);
    if (!state?.origin || !state?.value || !state?.detail) return null;
    return state;
  } catch (error) {
    console.warn("Discarding malformed Threshold return state.", error);
    sessionStorage.removeItem(returnStateKey);
    return null;
  }
}

function renderReturnState() {
  const state = currentReturnState();
  if (!state) {
    delete page.dataset.hubReturnOrigin;
    return;
  }
  page.dataset.hubReturnOrigin = state.origin.toLowerCase().replaceAll(" ", "-");
  reading.textContent = `${state.origin} returns as ${state.value}. ${state.detail}`;
  const seam = nextSeamFor(state);
  continueRoute.href = seam.href;
  continueLabel.textContent = seam.label;
  continueDetail.textContent = seam.detail;
}

function nextSeamFor(state) {
  if (state.origin === "Ocean") {
    return {
      href: "/portal/deepwater",
      label: "Continue into Deepwater",
      detail: "The Ocean returned pressure. The next seam is beneath the surface."
    };
  }
  if (state.origin === "Deepwater") {
    return {
      href: "/portal/first-door",
      label: "Let the First Door open",
      detail: "A pressure form has been read. The Hub can return it as stance."
    };
  }
  if (state.origin === "First Door" || state.origin === "Mirage") {
    return {
      href: "/portal/motion",
      label: "Enter the Motion Field",
      detail: "The next seam is motion: a world response to the stance you brought."
    };
  }
  if (state.origin === "Shore") {
    return {
      href: "/portal/ocean",
      label: "Face the Ocean",
      detail: "The shore returned a stance. The Ocean is ready to measure its depth."
    };
  }
  if (state.origin === "Ruins") {
    return {
      href: "/portal/quiet-grove",
      label: "Find the Quiet Grove",
      detail: "The Ruins made the pressure readable. Quiet-Weight can contain fracture without erasing its history."
    };
  }
  if (state.origin === "Quiet Grove") {
    return {
      href: "/portal/motion",
      label: "Resume through Motion",
      detail: "Quiet has re-cohered the field. Motion keeps it from becoming a Quiet-sink."
    };
  }
  if (state.origin === "Spiral Grove") {
    return {
      href: "/portal/quiet-grove",
      label: "Find the Quiet Grove",
      detail: "The Spiral Grove has made the loop readable. Quiet-Weight is its rare stabilizing exit."
    };
  }
  if (state.origin === "Doug") {
    return {
      href: "/portal/motion",
      label: "Follow the cleared vector",
      detail: "Doug handled the quiet fix. The system can move without forcing the loop."
    };
  }
  return {
    href: "/portal/ocean",
    label: "Return to the Ocean",
    detail: "A motion field has resolved. The Ocean can receive its depth."
  };
}

core?.addEventListener("click", () => {
  const awakened = page.classList.toggle("hub-is-awake");
  core.setAttribute("aria-pressed", String(awakened));
  core.querySelector(".hub-core-label").textContent = awakened ? "The Hub is listening" : "Awaken the Hub";
  if (awakened) {
    renderReturnState();
    if (!currentReturnState()) reading.textContent = returnStates[Math.floor(Math.random() * returnStates.length)];
  } else {
    reading.textContent = "Bring a vector to the core. The Hub will hold it without choosing for you.";
  }
});

window.addEventListener("pointermove", updateParallax, { passive: true });
renderReturnState();
