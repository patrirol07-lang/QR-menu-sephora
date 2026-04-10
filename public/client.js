const state = {
  categories: [],
  quantities: {},
  orderId: "---",
};

const menuRoot = document.getElementById("menu-root");
const orderIdLabel = document.getElementById("order-id");
const submitOrderIdLabel = document.getElementById("submit-order-id");
const selectedCountLabel = document.getElementById("selected-count");
const statusMessage = document.getElementById("status-message");
const submitButton = document.getElementById("submit-order");
const menuImageMap = {
  "golden-hour-macchiato": {
    src: "/menu/golden-hour-macchiato.jpg",
    alt: "Golden Hour Macchiato servido en vaso con espuma cremosa y tonos dorados.",
  },
  "glitter-iced-latte": {
    src: "/menu/glitter-iced-latte.png",
    alt: "Glitter Iced Latte frio servido en vaso alto con capas de cafe y leche.",
  },
  "pink-clay-mocha": {
    src: "/menu/pink-clay-mocha.jpg",
    alt: "Pink Clay Mocha servido en taza de cristal con nata y topping rosado.",
  },
  "cloud-matcha-latte": {
    src: "/menu/cloud-matcha-latte.jpeg",
    alt: "Cloud Matcha Latte servido en vaso con capas de matcha y leche.",
  },
  "strawberry-glow-matcha": {
    src: "/menu/strawberry-glow-matcha.jpg",
    alt: "Strawberry Glow Matcha con espuma rosa sobre matcha verde servido con hielo.",
  },
  "watermelon-spritz": {
    src: "/menu/watermelon-spritz.jpg",
    alt: "Watermelon Spritz rojo servido en vaso corto con decoracion de sandia y lima.",
  },
  "dragon-fruit-serum": {
    src: "/menu/dragon-fruit-serum.webp",
    alt: "Dragon Fruit Serum rosa intenso servido con fruta dragon y limon.",
  },
  "sephora-spritz": {
    src: "/menu/sephora-spritz.webp",
    alt: "Sephora Spritz rosado servido en vaso elegante con espuma y citricos.",
  },
  "black-diamond-martini": {
    src: "/menu/black-diamond-martini.webp",
    alt: "Black Diamond Martini oscuro servido en copa con brocheta de moras.",
  },
};

function setOrderId(orderId) {
  state.orderId = orderId;
  orderIdLabel.textContent = orderId;
  submitOrderIdLabel.textContent = orderId;
}

function getTotalSelected() {
  return Object.values(state.quantities).reduce((total, quantity) => total + quantity, 0);
}

function updateSelectedCount() {
  selectedCountLabel.textContent = String(getTotalSelected());
}

function setStatus(message, tone = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${tone}`.trim();
}

function changeQuantity(itemId, nextQuantity) {
  state.quantities[itemId] = Math.max(0, nextQuantity);
  const input = document.querySelector(`[data-quantity="${itemId}"]`);
  if (input) {
    input.value = state.quantities[itemId];
  }
  updateSelectedCount();
}

function createPlaceholder(item, category) {
  const placeholder = document.createElement("div");
  placeholder.className = "menu-item-placeholder";

  const label = document.createElement("span");
  label.className = "menu-item-placeholder-label";
  label.textContent = category;

  const initials = document.createElement("strong");
  initials.className = "menu-item-placeholder-initials";
  initials.textContent = item.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  const name = document.createElement("p");
  name.className = "menu-item-placeholder-name";
  name.textContent = item.name;

  placeholder.append(label, initials, name);
  return placeholder;
}

function createMenuMedia(item, category) {
  const media = document.createElement("div");
  media.className = "menu-item-media";

  const imageMeta = menuImageMap[item.id];
  if (!imageMeta) {
    media.classList.add("is-placeholder");
    media.appendChild(createPlaceholder(item, category));
    return media;
  }

  const image = document.createElement("img");
  image.className = "menu-item-image";
  image.src = imageMeta.src;
  image.alt = imageMeta.alt;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    if (media.classList.contains("is-placeholder")) {
      return;
    }

    media.classList.add("is-placeholder");
    media.innerHTML = "";
    media.appendChild(createPlaceholder(item, category));
  });

  media.appendChild(image);
  return media;
}

function renderMenu() {
  menuRoot.innerHTML = "";

  state.categories.forEach((category) => {
    const section = document.createElement("section");
    section.className = "category-section";

    const title = document.createElement("h3");
    title.textContent = category.category;
    section.appendChild(title);

    category.items.forEach((item) => {
      state.quantities[item.id] = state.quantities[item.id] ?? 0;

      const article = document.createElement("article");
      article.className = "menu-item";
      article.appendChild(createMenuMedia(item, category.category));

      const content = document.createElement("div");
      content.className = "menu-item-content";

      const details = document.createElement("div");
      details.className = "item-copy";

      const name = document.createElement("h4");
      name.textContent = item.name;

      const description = document.createElement("p");
      description.textContent = item.description;

      details.append(name, description);

      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      const decreaseButton = document.createElement("button");
      decreaseButton.type = "button";
      decreaseButton.className = "quantity-button";
      decreaseButton.textContent = "-";
      decreaseButton.addEventListener("click", () => {
        changeQuantity(item.id, state.quantities[item.id] - 1);
      });

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.min = "0";
      quantityInput.value = state.quantities[item.id];
      quantityInput.className = "quantity-input";
      quantityInput.dataset.quantity = item.id;
      quantityInput.addEventListener("change", (event) => {
        const nextValue = Number.parseInt(event.target.value, 10);
        changeQuantity(item.id, Number.isNaN(nextValue) ? 0 : nextValue);
      });

      const increaseButton = document.createElement("button");
      increaseButton.type = "button";
      increaseButton.className = "quantity-button";
      increaseButton.textContent = "+";
      increaseButton.addEventListener("click", () => {
        changeQuantity(item.id, state.quantities[item.id] + 1);
      });

      controls.append(decreaseButton, quantityInput, increaseButton);
      content.append(details, controls);
      article.appendChild(content);
      section.appendChild(article);
    });

    menuRoot.appendChild(section);
  });
}

function buildSelectedItems() {
  return state.categories.flatMap((category) =>
    category.items
      .filter((item) => (state.quantities[item.id] ?? 0) > 0)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: category.category,
        quantity: state.quantities[item.id],
      }))
  );
}

async function loadMenu() {
  const response = await fetch("/api/menu");
  if (!response.ok) {
    throw new Error("No se pudo cargar el menu.");
  }

  const payload = await response.json();
  state.categories = payload.categories;
  renderMenu();
  updateSelectedCount();
}

async function loadNextOrderId() {
  const response = await fetch("/api/next-order-id", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("No se pudo generar el siguiente numero de pedido.");
  }

  const payload = await response.json();
  setOrderId(payload.orderId);
}

async function submitOrder() {
  const items = buildSelectedItems();
  if (items.length === 0) {
    setStatus("Selecciona al menos una bebida antes de enviar.", "warning");
    return;
  }

  submitButton.disabled = true;
  setStatus("Enviando pedido a barra...", "");

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
      }),
    });

    if (!response.ok) {
      throw new Error("No se pudo guardar el pedido.");
    }

    const payload = await response.json();
    setStatus(`Pedido ${payload.order.orderId} enviado correctamente.`, "success");

    Object.keys(state.quantities).forEach((itemId) => {
      state.quantities[itemId] = 0;
    });

    renderMenu();
    updateSelectedCount();
    await loadNextOrderId();
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    submitButton.disabled = false;
  }
}

submitButton.addEventListener("click", submitOrder);

Promise.all([loadMenu(), loadNextOrderId()]).catch((error) => {
  setStatus(error.message, "warning");
});
