const practices = {
  story: {
    number: "01 / Immersive Lab",
    title: "Awaken curiosity through story.",
    body: "Enter a narrative chamber where ideas become places, choices, and remembered paths.",
    action: "Immersive Storytelling"
  },
  tech: {
    number: "02 / Signal Studio",
    title: "Spark imagination through tools.",
    body: "Use technology as a creative material: responsive, expressive, and shaped by intention.",
    action: "Creative Technologies"
  },
  design: {
    number: "03 / Reflection Chamber",
    title: "Embrace change through empathy.",
    body: "Notice what is needed, test a response, and let the next form emerge from what you learn.",
    action: "Design Thinking"
  },
  making: {
    number: "04 / Maker Space",
    title: "Activate agency through contribution.",
    body: "Build together by leaving a relic, shaping a branch, or adding an echo to the shared world.",
    action: "Collaborative Making"
  },
  critical: {
    number: "05 / Question Garden",
    title: "Awaken curiosity through reflection.",
    body: "Examine the frame, name the pressure, and ask which voices or possibilities remain outside it.",
    action: "Critical Pedagogy"
  }
};

const buttons = Array.from(document.querySelectorAll("[data-practice]"));
const dialog = document.getElementById("practiceDialog");
let activePractice = "story";

function selectPractice(name) {
  const practice = practices[name];
  activePractice = name;
  document.body.dataset.practice = name;
  document.getElementById("practiceNumber").textContent = practice.number;
  document.getElementById("practiceTitle").textContent = practice.title;
  document.getElementById("practiceBody").textContent = practice.body;
  buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.practice === name)));
}

buttons.forEach((button) => button.addEventListener("click", () => selectPractice(button.dataset.practice)));
document.getElementById("enterPractice").addEventListener("click", () => {
  const practice = practices[activePractice];
  document.getElementById("dialogKicker").textContent = practice.number;
  document.getElementById("dialogTitle").textContent = practice.action;
  document.getElementById("dialogBody").textContent = practice.body;
  dialog.showModal();
});
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
selectPractice(activePractice);