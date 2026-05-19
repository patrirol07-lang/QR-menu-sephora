const reviewForm = document.getElementById("review-form");
const reviewNameInput = document.getElementById("review-name");
const reviewProductInput = document.getElementById("review-product");
const reviewTextInput = document.getElementById("review-text");
const reviewConsentInput = document.getElementById("review-consent");
const reviewMessage = document.getElementById("review-message");
const reviewSubmitButton = document.getElementById("review-submit");
const ratingEmoji = document.getElementById("rating-emoji");
const ratingLabel = document.getElementById("rating-label");
const starButtons = Array.from(document.querySelectorAll(".star-button"));

const ratingMap = {
  1: { label: "Muy mala", emoji: "😞" },
  2: { label: "Regular", emoji: "😕" },
  3: { label: "Bien", emoji: "🙂" },
  4: { label: "Muy bien", emoji: "😄" },
  5: { label: "Excelente", emoji: "😍" },
};

const ratingState = {
  selected: 0,
  hovered: 0,
};

function getActiveRating() {
  return ratingState.hovered || ratingState.selected;
}

function setReviewMessage(message, tone = "") {
  reviewMessage.textContent = message;
  reviewMessage.className = `status-message ${tone}`.trim();
}

function updateRatingUI() {
  const activeRating = getActiveRating();
  const feedback = ratingMap[activeRating];

  starButtons.forEach((button) => {
    const buttonRating = Number.parseInt(button.dataset.rating, 10);
    const isActive = buttonRating <= activeRating;
    const isSelected = buttonRating <= ratingState.selected;

    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(buttonRating === ratingState.selected));
  });

  if (!feedback) {
    ratingEmoji.textContent = "🙂";
    ratingLabel.textContent = "Selecciona tu valoración";
    return;
  }

  ratingEmoji.textContent = feedback.emoji;
  ratingLabel.textContent = `${activeRating} estrella${activeRating > 1 ? "s" : ""} · ${feedback.label}`;
}

function handleRatingSelection(nextRating) {
  ratingState.selected = nextRating;
  updateRatingUI();
}

starButtons.forEach((button) => {
  const buttonRating = Number.parseInt(button.dataset.rating, 10);

  button.addEventListener("mouseenter", () => {
    ratingState.hovered = buttonRating;
    updateRatingUI();
  });

  button.addEventListener("mouseleave", () => {
    ratingState.hovered = 0;
    updateRatingUI();
  });

  button.addEventListener("focus", () => {
    ratingState.hovered = buttonRating;
    updateRatingUI();
  });

  button.addEventListener("blur", () => {
    ratingState.hovered = 0;
    updateRatingUI();
  });

  button.addEventListener("click", () => {
    handleRatingSelection(buttonRating);
  });
});

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const wouldReturn = reviewForm.elements.wouldReturn.value || "";
  const reviewText = reviewTextInput.value.trim();
  const productTried = reviewProductInput.value;

  if (ratingState.selected === 0) {
    setReviewMessage("Selecciona una valoración antes de enviar tu opinión.", "warning");
    return;
  }

  if (!productTried) {
    setReviewMessage("Selecciona qué producto o servicio has probado.", "warning");
    return;
  }

  if (!reviewText) {
    setReviewMessage("Escribe tu opinión antes de enviarla.", "warning");
    return;
  }

  if (!reviewConsentInput.checked) {
    setReviewMessage(
      "Debes aceptar que tu opinión pueda ser revisada y usada públicamente.",
      "warning"
    );
    return;
  }

  reviewSubmitButton.disabled = true;
  setReviewMessage("Enviando tu opinión...", "");

  try {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: reviewNameInput.value.trim(),
        rating: ratingState.selected,
        reviewText,
        productTried,
        wouldReturn,
        publishConsent: reviewConsentInput.checked,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "No se pudo enviar la opinión.");
    }

    reviewForm.reset();
    ratingState.selected = 0;
    ratingState.hovered = 0;
    updateRatingUI();
    setReviewMessage(
      "Gracias por tu opinión. Tu valoración ha sido enviada correctamente y será revisada antes de publicarse.",
      "success"
    );
  } catch (error) {
    setReviewMessage(error.message, "warning");
  } finally {
    reviewSubmitButton.disabled = false;
  }
});

updateRatingUI();
