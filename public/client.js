const state = {
  categories: [],
  quantities: {},
  orderId: createOrderId(),
};

const menuRoot = document.getElementById("menu-root");
const orderIdLabel = document.getElementById("order-id");
const submitOrderIdLabel = document.getElementById("submit-order-id");
const selectedCountLabel = document.getElementById("selected-count");
const statusMessage = document.getElementById("status-message");
const submitButton = document.getElementById("submit-order");

function createOrderId() {
  const randomPart = Math.floor(Math.random() * 900 + 100);
  return `SPH-${Date.now().toString().slice(-6)}-${randomPart}`;
}

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
      article.append(details, controls);
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
        orderId: state.orderId,
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
    setOrderId(createOrderId());
  } catch (error) {
    setStatus(error.message, "warning");
  } finally {
    submitButton.disabled = false;
  }
}

submitButton.addEventListener("click", submitOrder);

setOrderId(state.orderId);
loadMenu().catch((error) => {
  setStatus(error.message, "warning");
});
