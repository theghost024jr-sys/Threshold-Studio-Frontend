function messageForState(state) {
  return `Engine state synchronized at sequence ${state.sequence}.`;
}

function messageForAcceptance(acceptance) {
  return `Engine accepted ${acceptance.intent.type} for ${acceptance.intent.nodeId}.`;
}

function messageForRejection(rejection) {
  return `Engine rejected intent: ${rejection.message}`;
}

export function bindEngineFeedback({
  root = document.body,
  status = root.querySelector("[data-engine-feedback]"),
  eventTarget = window
} = {}) {
  if (!root || !status || !eventTarget) {
    return () => {};
  }

  const onState = (event) => {
    const state = event.detail;
    root.dataset.engineFeedbackState = "synchronized";
    root.dataset.engineSequence = String(state.sequence);
    status.dataset.engineFeedback = "synchronized";
    status.textContent = messageForState(state);
  };
  const onAccepted = (event) => {
    const acceptance = event.detail;
    root.dataset.engineFeedbackState = "accepted";
    status.dataset.engineFeedback = "accepted";
    status.textContent = messageForAcceptance(acceptance);
  };
  const onRejected = (event) => {
    const rejection = event.detail;
    root.dataset.engineFeedbackState = "rejected";
    status.dataset.engineFeedback = "rejected";
    status.textContent = messageForRejection(rejection);
  };

  eventTarget.addEventListener("threshold:engine-state", onState);
  eventTarget.addEventListener("threshold:engine-intent-accepted", onAccepted);
  eventTarget.addEventListener("threshold:engine-rejection", onRejected);

  return () => {
    eventTarget.removeEventListener("threshold:engine-state", onState);
    eventTarget.removeEventListener("threshold:engine-intent-accepted", onAccepted);
    eventTarget.removeEventListener("threshold:engine-rejection", onRejected);
  };
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  bindEngineFeedback();
}
