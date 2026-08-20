const modal = document.getElementById("glyphModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const closeButton = document.querySelector(".close-button");

const glyphCards = document.querySelectorAll(".glyph-card");

const glyphData = {
  "The Mobius Strip with Three Loops": "A ritual of recursion, shimmer, and the refusal to flatten.",
  "The Pendant That Refused to Collapse": "Pressed from soil and ache, it loops breath into resilience.",
  "The Guest Who Became Gravity": "She stayed long enough to bend the room around her presence.",
  // Add more glyphs here
};

glyphCards.forEach(card => {
  card.addEventListener("click", () => {
    const title = card.textContent.trim();
    modalTitle.textContent = title;
    modalDescription.textContent = glyphData[title] || "This glyph hums with mystery.";
    modal.style.display = "block";
  });
});

closeButton.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", event => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

