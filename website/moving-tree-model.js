function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

export class MovingTree {
  constructor(id) {
    this.id = requireNonEmptyString(id, "tree.id");
    this.state = "Following";
  }

  respondToPlayerAction(action) {
    if (!action || typeof action !== "object" || Array.isArray(action)) {
      throw new TypeError("tree action must be an object");
    }
    if (action.type !== "ask-if-following") {
      throw new TypeError('tree action.type must be "ask-if-following"');
    }

    const changed = this.state === "Following";
    if (changed) {
      this.state = "Withdrawing";
    }
    return this.snapshot({ changed });
  }

  reset() {
    this.state = "Following";
    return this.snapshot({ reset: true });
  }

  snapshot(extra = {}) {
    return Object.freeze({
      id: this.id,
      state: this.state,
      isFollowing: this.state === "Following",
      ...extra
    });
  }
}
