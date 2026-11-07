const page = document.querySelector("[data-ethos-seed]");
const seed = document.querySelector("[data-ethos-seed-node]");
const returnLink = document.querySelector("[data-ethos-seed-return]");
const status = document.querySelector("[data-ethos-seed-status]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function arrivedFromEthos() {
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === location.origin && referrer.pathname === "/ethos.html";
  } catch {
    return false;
  }
}

function setFieldPosition(event) {
  const bounds = seed.getBoundingClientRect();
  const x = event.clientX - bounds.left - bounds.width / 2;
  const y = event.clientY - bounds.top - bounds.height / 2;
  page.style.setProperty("--ethos-seed-field-x", `${event.clientX}px`);
  page.style.setProperty("--ethos-seed-field-y", `${event.clientY}px`);
  page.style.setProperty("--ethos-seed-offset-x", `${Math.max(-8, Math.min(8, x * 0.025))}px`);
  page.style.setProperty("--ethos-seed-offset-y", `${Math.max(-6, Math.min(6, y * 0.02))}px`);
}

function setCoherence(active) {
  page.dataset.seedCoherence = active ? "active" : "quiet";
}

function isModifiedActivation(event) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

if (page && seed && returnLink && status) {
  page.dataset.ethosSeedContext = arrivedFromEthos() ? "ethos-arrival" : "dormant";
  seed.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches) return;
    setFieldPosition(event);
    setCoherence(true);
  });
  seed.addEventListener("pointerleave", () => setCoherence(false));
  seed.addEventListener("focusin", () => setCoherence(true));
  seed.addEventListener("focusout", () => setCoherence(false));
  returnLink.addEventListener("focus", () => {
    page.classList.add("is-return-axis");
    status.textContent = "Return axis aligned";
  });
  returnLink.addEventListener("blur", () => {
    page.classList.remove("is-return-axis");
    status.textContent = "";
  });
  returnLink.addEventListener("click", (event) => {
    if (isModifiedActivation(event)) return;
    event.preventDefault();
    page.classList.add("is-returning");
    status.textContent = "Reorienting toward Ethos";
    window.setTimeout(
      () => location.assign(returnLink.href),
      reducedMotion.matches ? 0 : 520
    );
  });
}
