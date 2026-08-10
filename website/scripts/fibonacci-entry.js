import { buildFibonacciUrl, resolveFibonacciRoute } from "./fibonacci-routing.js";

const routeLinks = document.querySelectorAll("[data-fibonacci-spoke][data-fibonacci-path]");
const seedArchive = document.querySelector("[data-hub-seed-archive]");
const seedList = document.querySelector("[data-hub-seed-list]");

function title(value) {
  return String(value || "unknown").replace(/-/g, " ");
}

function loadReturnedSeeds() {
  try {
    const seeds = JSON.parse(sessionStorage.getItem("threshold:hub-seeds") || "[]");
    return Array.isArray(seeds) ? seeds.slice(-6).reverse() : [];
  } catch {
    return [];
  }
}

function renderReturnedSeeds() {
  if (!seedArchive || !seedList) {
    return;
  }
  const seeds = loadReturnedSeeds();
  seedList.replaceChildren();
  seeds.forEach((seed) => {
    const state = seed && seed.state || {};
    const item = document.createElement("li");
    const fib = document.createElement("span");
    const version = document.createElement("span");
    const memory = document.createElement("span");
    fib.className = "entry-seed-fib";
    version.className = "entry-seed-version";
    memory.className = "entry-seed-memory";
    fib.textContent = "Fib " + String(seed.fromFib || "?");
    version.textContent = title(state.version);
    memory.textContent = "Returned with " + title(state.choice)
      + " · " + String(Number(state.stays || 0)) + " stays";
    item.append(fib, version, memory);
    seedList.appendChild(item);
  });
  seedArchive.hidden = seeds.length === 0;
}

renderReturnedSeeds();

if (routeLinks.length) {
  fetch("config/fibonacci-routes.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Fibonacci routes unavailable (" + response.status + ")");
      }
      return response.json();
    })
    .then((config) => {
      routeLinks.forEach((link) => {
        const lineage = resolveFibonacciRoute(
          config,
          link.dataset.fibonacciSpoke,
          link.dataset.fibonacciPath
        );
        link.href = buildFibonacciUrl(lineage, link.getAttribute("href"));
        link.addEventListener("click", () => {
          sessionStorage.setItem("threshold.fibonacci.lineage", JSON.stringify(lineage));
        });
      });
    })
    .catch((error) => {
      console.error(error);
    });
}