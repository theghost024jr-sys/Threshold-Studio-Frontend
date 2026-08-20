const WEATHER_IDS = {
  fog: "weather-fog",
  expand: "weather-shimmer",
  collapse: "weather-storm",
  soil: "weather-soil"
};

export function createWeatherModule() {
  return {
    apply(channel) {
      document.body.dataset.thresholdWeather = channel;

      Object.keys(WEATHER_IDS).forEach(function (key) {
        const node = document.getElementById(WEATHER_IDS[key]);
        if (!node) {
          return;
        }
        node.style.opacity = key === channel ? "1" : "0";
        node.style.pointerEvents = "none";
      });
    }
  };
}