const HouseGardenModule = {
  init(engine) {
    const season = this.detectSeason();
    const channel = engine.setWeather(season);

    engine.invokeMythic({ type: "spirit", season: season });

    const glyphs = document.getElementById("shimmer-glyphs");
    if (glyphs) {
      glyphs.style.opacity = channel === "expand" ? "1" : "0.28";
      glyphs.textContent = channel === "expand" ? "Shimmer Glyph Drift Active" : "Surface Glyph Drift Idle";
    }

    this.renderGarden(channel);
    this.renderHouse(channel);

    const chamber = document.getElementById("project-chamber");
    if (chamber) {
      chamber.dataset.channel = channel;
      chamber.textContent = "Surface channel: " + channel + " | HouseGarden module active";
    }
  },

  detectSeason() {
    const hour = new Date().getHours();
    if (hour < 6) {
      return "soil";
    }
    if (hour < 12) {
      return "fog";
    }
    if (hour < 18) {
      return "shimmer";
    }
    return "storm";
  },

  renderGarden(channel) {
    const garden = document.getElementById("garden-surface");
    if (!garden) {
      return;
    }

    const map = {
      fog: "Mist Garden - soft beginnings",
      expand: "Light Garden - expansion",
      collapse: "Cracked Garden - pressure",
      soil: "Root Garden - integration",
      threshold: "Threshold Garden - listening"
    };

    garden.textContent = map[channel] || map.threshold;
  },

  renderHouse(channel) {
    const house = document.getElementById("house-structure");
    if (!house) {
      return;
    }

    const map = {
      fog: "House Structure - porous walls, quiet passage",
      expand: "House Structure - open windows, luminous corridors",
      collapse: "House Structure - stress seams visible, holding",
      soil: "House Structure - low flame, rooted frame",
      threshold: "House Structure - neutral shell"
    };

    house.textContent = map[channel] || map.threshold;
  }
};

export default HouseGardenModule;
