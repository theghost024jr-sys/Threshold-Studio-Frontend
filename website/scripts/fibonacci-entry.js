import { buildFibonacciUrl, resolveFibonacciRoute } from "./fibonacci-routing.js";

const routeLinks = document.querySelectorAll("[data-fibonacci-spoke][data-fibonacci-path]");

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
        link.href = buildFibonacciUrl(lineage);
        link.addEventListener("click", () => {
          sessionStorage.setItem("threshold.fibonacci.lineage", JSON.stringify(lineage));
        });
      });
    })
    .catch((error) => {
      console.error(error);
    });
}