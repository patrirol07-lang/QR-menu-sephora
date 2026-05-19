# Shepora Cafe - Carta digital demo

Demo interactiva de carta digital para Shepora Cafe.

Incluye:
- Vista cliente para seleccionar bebidas y enviar pedidos
- Vista barra para ver pedidos en orden de llegada y marcarlos como entregados
- Pagina de opiniones para valorar la experiencia con estrellas y comentario

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm start
```

La app arranca por defecto en `http://localhost:8080`.

## Rutas disponibles

- `/` - vista cliente
- `/barra` - vista barra
- `/opiniones` - pagina de opiniones

## Como probar el flujo cliente

1. Entra en `/`.
2. Elige una o varias bebidas y ajusta cantidades.
3. Pulsa `ENVIAR`.
4. Comprueba el mensaje de confirmacion del pedido.
5. Si quieres, usa el CTA de opiniones que aparece tras enviar el pedido.

## Como probar la barra

1. Entra en `/barra`.
2. Comprueba que los pedidos nuevos aparecen en pedidos activos.
3. Pulsa el boton para marcar un pedido como entregado.
4. Verifica que pasa a la seccion de completados y entregados.

## Como probar opiniones

1. Entra en `/opiniones`.
2. Selecciona una valoracion con estrellas.
3. Elige el producto probado.
4. Escribe una opinion.
5. Marca el consentimiento.
6. Pulsa `Enviar opinion`.
7. Comprueba que la opinion queda guardada en [data/reviews.json](C:\Users\xxgab\OneDrive\Documentos\GitHub\QR-menu-sephora\data\reviews.json) con `status: "pending"`.

## Limitaciones actuales

- [data/orders.json](C:\Users\xxgab\OneDrive\Documentos\GitHub\QR-menu-sephora\data\orders.json) y [data/reviews.json](C:\Users\xxgab\OneDrive\Documentos\GitHub\QR-menu-sephora\data\reviews.json) sirven para demo y entorno local.
- En Render o produccion la persistencia en JSON puede no mantenerse entre reinicios o despliegues.
- Las opiniones no se publican automaticamente.
- Falta un panel o flujo de moderacion para aprobar o rechazar reseñas.
- Para una version real conviene mover pedidos y opiniones a Google Sheets, Airtable o una base de datos.

## Como enseñarlo como demo

1. Abre `/`.
2. Haz un pedido desde la vista cliente.
3. Abre `/barra` y enseña que el pedido aparece.
4. Marca el pedido como entregado.
5. Abre `/opiniones`.
6. Envia una opinion con estrellas y comentario.

