const seal = document.querySelector("[data-threshold-accept]");

function openInvitation() {
  if (!seal || seal.disabled || document.body.classList.contains("invitation-open")) return;
  document.body.classList.add("invitation-open");
  seal.setAttribute("aria-expanded", "true");
}

seal?.setAttribute("aria-expanded", "false");
seal?.addEventListener("click", openInvitation);