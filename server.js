const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

const MENU = [
  {
    category: "CAFE",
    items: [
      {
        id: "golden-hour-macchiato",
        name: "Palette de Chocolatt",
        description: "Cafe con leche, curcuma y un toque de canela.",
        price: 4.79,
      },
      {
        id: "glitter-iced-latte",
        name: "Glitter Iced Latte",
        description: "Cafe con leche frio, sirope de vainilla y purpurina dorada comestible.",
        price: 5.2,
      },
      {
        id: "pink-clay-mocha",
        name: "Pink Clay Mocha",
        description: "Moca de chocolate blanco con sirope de frambuesa.",
        price: 6.2,
      },
    ],
  },
  {
    category: "MATCHA",
    items: [
      {
        id: "cloud-matcha-latte",
        name: "Cloud Matcha Latte",
        description: "Matcha ceremonial con espuma fria de leche infusionada con taro.",
        price: 5.5,
      },
      {
        id: "strawberry-glow-matcha",
        name: "Strawberry Glow Matcha",
        description: "Pure de fresas naturales, leche de coco y matcha servido en capas.",
        price: 5.24,
      },
    ],
  },
  {
    category: "REFRESCOS",
    items: [
      {
        id: "watermelon-serum",
        name: "Watermelon Serum",
        description: "Zumo de sandia, lima y borde con sal negra.",
        price: 6,
      },
      {
        id: "blush-on-the-beach",
        name: "Sun Kiss Blush",
        description: "Refresco de zumo de pina, sirope de melocoton y zumo de granada.",
        price: 6.5,
      },
    ],
  },
  {
    category: "COCTELES",
    items: [
      {
        id: "sephora-spritz",
        name: "Sephora Spritz",
        description: "Aperol, soda de pomelo rosa y borde de azucar de fresa.",
        price: 7.7,
      },
      {
        id: "black-diamond-martini",
        name: "Black Diamond Martini",
        description: "Vodka y zumo de mora negra, decorado con brocheta de arandanos.",
        price: 7.5,
      },
    ],
  },
];

function ensureProjectFiles() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, "[]\n", "utf8");
  }

  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(REVIEWS_FILE, "[]\n", "utf8");
  }
}

function normalizeItem(item = {}) {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    category: String(item.category ?? ""),
    quantity: Number.parseInt(item.quantity, 10) || 0,
  };
}

function normalizeOrder(order = {}) {
  const items = Array.isArray(order.items) ? order.items.map(normalizeItem) : [];

  return {
    orderId: String(order.orderId ?? ""),
    createdAt: String(order.createdAt ?? ""),
    status:
      typeof order.status === "string" && order.status.trim().length > 0
        ? order.status
        : "active",
    completedAt: order.completedAt ? String(order.completedAt) : null,
    items,
  };
}

function normalizeReview(review = {}) {
  return {
    id: String(review.id ?? ""),
    name: String(review.name ?? ""),
    rating: Number.parseInt(review.rating, 10) || 0,
    reviewText: String(review.reviewText ?? ""),
    productTried: String(review.productTried ?? ""),
    wouldReturn: String(review.wouldReturn ?? ""),
    publishConsent: Boolean(review.publishConsent),
    status:
      typeof review.status === "string" && review.status.trim().length > 0
        ? review.status
        : "pending",
    createdAt: String(review.createdAt ?? ""),
  };
}

function readOrders() {
  ensureProjectFiles();

  const raw = fs.readFileSync(ORDERS_FILE, "utf8").trim();
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  const orders = Array.isArray(parsed) ? parsed : [parsed];
  return orders.map(normalizeOrder);
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

function readReviews() {
  ensureProjectFiles();

  const raw = fs.readFileSync(REVIEWS_FILE, "utf8").trim();
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  const reviews = Array.isArray(parsed) ? parsed : [parsed];
  return reviews.map(normalizeReview);
}

function writeReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, `${JSON.stringify(reviews, null, 2)}\n`, "utf8");
}

function getNextOrderId(orders) {
  let maxSequence = 0;

  for (const order of orders) {
    const match = String(order.orderId).match(/^A-(\d+)$/);
    if (!match) {
      continue;
    }

    const sequence = Number.parseInt(match[1], 10);
    if (sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `A-${maxSequence + 1}`;
}

function getNextReviewId(reviews) {
  let maxSequence = 0;

  for (const review of reviews) {
    const match = String(review.id).match(/^R-(\d+)$/);
    if (!match) {
      continue;
    }

    const sequence = Number.parseInt(match[1], 10);
    if (sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `R-${maxSequence + 1}`;
}

function buildNewOrder(body) {
  const items = Array.isArray(body.items)
    ? body.items.map(normalizeItem).filter((item) => item.quantity > 0)
    : [];

  if (items.length === 0) {
    const error = new Error("El pedido debe incluir al menos una bebida.");
    error.statusCode = 400;
    throw error;
  }

  const orders = readOrders();
  const order = {
    orderId: getNextOrderId(orders),
    createdAt: new Date().toISOString(),
    status: "active",
    completedAt: null,
    items,
  };

  orders.push(order);
  writeOrders(orders);
  return order;
}

function completeOrder(orderId) {
  if (!orderId || typeof orderId !== "string") {
    const error = new Error("Debes indicar el identificador del pedido.");
    error.statusCode = 400;
    throw error;
  }

  const orders = readOrders();
  const order = orders.find((entry) => entry.orderId === orderId && entry.status !== "completed");

  if (!order) {
    const error = new Error("No se encontro un pedido activo con ese identificador.");
    error.statusCode = 404;
    throw error;
  }

  order.status = "completed";
  order.completedAt = new Date().toISOString();
  writeOrders(orders);

  return order;
}

function buildNewReview(body) {
  const rating = Number.parseInt(body.rating, 10) || 0;
  const reviewText = typeof body.reviewText === "string" ? body.reviewText.trim() : "";
  const productTried =
    typeof body.productTried === "string" ? body.productTried.trim() : "";
  const publishConsent = Boolean(body.publishConsent);
  const wouldReturn =
    typeof body.wouldReturn === "string" ? body.wouldReturn.trim() : "";

  if (rating < 1 || rating > 5) {
    const error = new Error("Selecciona una valoración entre 1 y 5 estrellas.");
    error.statusCode = 400;
    throw error;
  }

  if (!productTried) {
    const error = new Error("Selecciona qué producto o servicio has probado.");
    error.statusCode = 400;
    throw error;
  }

  if (!reviewText) {
    const error = new Error("Escribe una opinión antes de enviarla.");
    error.statusCode = 400;
    throw error;
  }

  if (!publishConsent) {
    const error = new Error(
      "Debes aceptar que tu opinión pueda ser revisada y usada públicamente."
    );
    error.statusCode = 400;
    throw error;
  }

  const reviews = readReviews();
  const review = {
    id: getNextReviewId(reviews),
    name: typeof body.name === "string" ? body.name.trim() : "",
    rating,
    reviewText,
    productTried,
    wouldReturn,
    publishConsent: true,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  reviews.push(review);
  writeReviews(reviews);
  return review;
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR));

app.get("/", (_request, response) => {
  response.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/barra", (_request, response) => {
  response.sendFile(path.join(PUBLIC_DIR, "barra.html"));
});

app.get("/opiniones", (_request, response) => {
  response.sendFile(path.join(PUBLIC_DIR, "opiniones.html"));
});

app.get("/api/menu", (_request, response) => {
  response.json({ categories: MENU });
});

app.get("/api/next-order-id", (_request, response) => {
  response.json({ orderId: getNextOrderId(readOrders()) });
});

app.get("/api/orders", (_request, response) => {
  const orders = readOrders().sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  response.json({ orders });
});

app.get("/api/reviews", (_request, response) => {
  const reviews = readReviews()
    .filter((review) => review.status === "approved")
    .sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  response.json({ reviews });
});

app.post("/api/orders", (request, response, next) => {
  try {
    const order = buildNewOrder(request.body ?? {});
    response.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders/complete", (request, response, next) => {
  try {
    const order = completeOrder(request.body?.orderId);
    response.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reviews", (request, response, next) => {
  try {
    const review = buildNewReview(request.body ?? {});
    response.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
});

app.use((request, response) => {
  response.status(404).json({ error: "Ruta API no encontrada." });
});

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Se ha producido un error interno.";

  response.status(statusCode).json({
    error: message,
  });
});

ensureProjectFiles();

app.listen(PORT, () => {
  console.log(`Carta digital lista para demo`);
  console.log(`Cliente: http://localhost:${PORT}/`);
  console.log(`Barra:   http://localhost:${PORT}/barra`);
});
