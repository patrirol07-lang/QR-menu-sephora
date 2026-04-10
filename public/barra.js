const ordersRoot = document.getElementById("orders-root");
const completedOrdersRoot = document.getElementById("completed-orders-root");
const ordersCount = document.getElementById("orders-count");
const completedCount = document.getElementById("completed-count");
const lastUpdated = document.getElementById("last-updated");
const refreshOrdersButton = document.getElementById("refresh-orders");

function formatTime(value) {
  return new Date(value).toLocaleTimeString("es-ES");
}

function buildOrderCard(order, index, type) {
  const card = document.createElement("article");
  card.className = `order-card ${type === "completed" ? "order-card-completed" : ""}`.trim();

  const header = document.createElement("div");
  header.className = "order-card-header";

  const titleGroup = document.createElement("div");

  const title = document.createElement("h3");
  title.textContent = order.orderId;

  const subtitle = document.createElement("p");
  if (type === "completed") {
    subtitle.textContent = `Entregado a las ${formatTime(order.completedAt || order.createdAt)}`;
  } else {
    subtitle.textContent = `${index + 1}. recibido a las ${formatTime(order.createdAt)}`;
  }
  titleGroup.append(title, subtitle);

  const total = document.createElement("strong");
  total.textContent = `${order.items.reduce((sum, item) => sum + item.quantity, 0)} uds`;

  header.append(titleGroup, total);

  const list = document.createElement("ul");
  list.className = "order-items";

  order.items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${item.quantity} x ${item.name} - ${item.category}`;
    list.appendChild(listItem);
  });

  card.append(header, list);

  if (type === "active") {
    const actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = "primary-button order-action-button";
    actionButton.textContent = "Marcar como entregado";
    actionButton.addEventListener("click", async () => {
      actionButton.disabled = true;
      actionButton.textContent = "Guardando...";

      try {
        const response = await fetch("/api/orders/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: order.orderId }),
        });

        if (!response.ok) {
          throw new Error("No se pudo actualizar el pedido.");
        }

        await loadOrders();
      } catch (error) {
        actionButton.disabled = false;
        actionButton.textContent = "Marcar como entregado";
        window.alert(error.message);
      }
    });

    card.appendChild(actionButton);
  }

  return card;
}

function renderOrderGroup(rootElement, orders, emptyMessage, type) {
  rootElement.innerHTML = "";

  if (!orders || orders.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = emptyMessage;
    rootElement.appendChild(emptyState);
    return;
  }

  orders.forEach((order, index) => {
    rootElement.appendChild(buildOrderCard(order, index, type));
  });
}

function renderOrders(orders) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const activeOrders = safeOrders.filter((order) => order.status !== "completed");
  const completedOrders = safeOrders
    .filter((order) => order.status === "completed")
    .sort((left, right) => new Date(right.completedAt || right.createdAt) - new Date(left.completedAt || left.createdAt));

  ordersCount.textContent = String(activeOrders.length);
  completedCount.textContent = String(completedOrders.length);

  renderOrderGroup(
    ordersRoot,
    activeOrders,
    "Todavia no hay pedidos pendientes. La barra esta lista.",
    "active"
  );

  renderOrderGroup(
    completedOrdersRoot,
    completedOrders,
    "Aun no se ha entregado ningun pedido.",
    "completed"
  );
}

async function loadOrders() {
  const response = await fetch("/api/orders", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("No se pudieron cargar los pedidos.");
  }

  const payload = await response.json();
  renderOrders(payload.orders);
  lastUpdated.textContent = new Date().toLocaleTimeString("es-ES");
}

function showLoadError(message) {
  const errorHtml = `<div class="empty-state">${message}</div>`;
  ordersRoot.innerHTML = errorHtml;
  completedOrdersRoot.innerHTML = errorHtml;
}

refreshOrdersButton.addEventListener("click", () => {
  loadOrders().catch((error) => {
    showLoadError(error.message);
  });
});

loadOrders().catch((error) => {
  showLoadError(error.message);
});

window.setInterval(() => {
  loadOrders().catch(() => {
    // En demo preferimos mantener la ultima vista valida si falla una recarga puntual.
  });
}, 3000);
