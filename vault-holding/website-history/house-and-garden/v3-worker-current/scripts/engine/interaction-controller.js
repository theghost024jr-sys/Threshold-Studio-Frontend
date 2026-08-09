function wireTarget(target, path, callbacks) {
  const onEnter = () => callbacks.onHover?.(path);
  const onLeave = () => callbacks.onClearHover?.();
  const onFocus = () => callbacks.onHover?.(path);
  const onBlur = () => callbacks.onClearHover?.();
  const onActivate = () => callbacks.onActivate?.(path);

  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callbacks.onActivate?.(path);
      return;
    }

    if (event.key === "Escape") {
      callbacks.onEscape?.();
    }
  };

  target.addEventListener("pointerenter", onEnter);
  target.addEventListener("pointerleave", onLeave);
  target.addEventListener("focus", onFocus);
  target.addEventListener("blur", onBlur);
  target.addEventListener("pointerdown", onActivate);
  target.addEventListener("click", onActivate);
  target.addEventListener("keydown", onKeyDown);

  return () => {
    target.removeEventListener("pointerenter", onEnter);
    target.removeEventListener("pointerleave", onLeave);
    target.removeEventListener("focus", onFocus);
    target.removeEventListener("blur", onBlur);
    target.removeEventListener("pointerdown", onActivate);
    target.removeEventListener("click", onActivate);
    target.removeEventListener("keydown", onKeyDown);
  };
}

export function createInteractionController({ targets, callbacks }) {
  const unbinders = [];

  for (const targetConfig of targets) {
    const { element, path } = targetConfig;
    if (!element || !path) continue;
    unbinders.push(wireTarget(element, path, callbacks));
  }

  return {
    destroy() {
      while (unbinders.length) {
        const unbind = unbinders.pop();
        unbind();
      }
    },
  };
}
