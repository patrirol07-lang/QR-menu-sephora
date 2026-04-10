# Sephora Cafe QR Menu MVP

MVP funcional de carta digital con dos vistas:

- Cliente: selecciona bebidas y envia pedidos.
- Barra: ve los pedidos en orden de llegada, puede marcarlos como entregados y los archiva en completados.

La solucion esta pensada para demo academica y usa solo PowerShell + .NET integrado, porque el repositorio estaba vacio y en este entorno no estan disponibles `node`, `npm` ni `python`.

## Estructura

- `server.ps1`: servidor HTTP y API.
- `public/index.html`: carta publica para cliente.
- `public/barra.html`: pantalla de barra.
- `public/client.js`: logica del flujo cliente.
- `public/barra.js`: actualizacion de pedidos en barra y gestion de entregados.
- `public/styles.css`: estilo visual responsive.
- `data/orders.json`: persistencia simple de pedidos.

## Como arrancar

1. Abre PowerShell en la raiz del proyecto.
2. Ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

3. Abre estas URLs en el navegador:

- Cliente: `http://localhost:8080/`
- Barra: `http://localhost:8080/barra`

## Configuracion

No hace falta base de datos ni variables de entorno.

- Los pedidos se guardan en `data/orders.json`.
- El servidor escucha en `http://localhost:8080/`.
- Cada pedido guarda `status` y `completedAt` para distinguir activos de entregados.

Si necesitas reiniciar la demo con la cola vacia, deja el servidor parado y reemplaza el contenido de `data/orders.json` por:

```json
[]
```

## Como probar el flujo cliente

1. Entra en `http://localhost:8080/`.
2. Comprueba que aparece un identificador de pedido visible en la parte superior y junto al boton final.
3. Selecciona cantidades de una o varias bebidas.
4. Pulsa `ENVIAR`.
5. Verifica el mensaje de confirmacion.
6. Comprueba que se genera un nuevo identificador para el siguiente pedido.

## Como probar el flujo barra

1. Abre `http://localhost:8080/barra` en otra pestaña o segunda pantalla.
2. Deja la vista abierta.
3. Envia pedidos desde la pantalla cliente.
4. Verifica que los pedidos aparecen en la cola activa por orden de llegada.
5. Pulsa `Marcar como entregado` en cualquiera de ellos.
6. Comprueba que desaparece de activos y pasa a `Completos y entregados`.
7. La vista se refresca automaticamente cada 3 segundos.
8. Si quieres forzar una comprobacion inmediata, pulsa `Actualizar`.

## API disponible

- `GET /api/menu`: devuelve el menu inicial.
- `GET /api/orders`: devuelve todos los pedidos guardados.
- `POST /api/orders`: guarda un pedido nuevo.
- `POST /api/orders/complete`: marca un pedido como completado y entregado.

Ejemplo de payload para `POST /api/orders`:

```json
{
  "orderId": "SPH-123456-789",
  "items": [
    {
      "id": "golden-hour-macchiato",
      "name": "Golden Hour Macchiato",
      "category": "CAFE",
      "quantity": 2
    }
  ]
}
```

Ejemplo de payload para `POST /api/orders/complete`:

```json
{
  "orderId": "SPH-123456-789"
}
```

## Decisiones tecnicas

- Persistencia: archivo JSON por simplicidad y facilidad de demo.
- Actualizacion de barra: polling cada 3 segundos, porque es la solucion mas simple y fiable para una presentacion.
- Frontend: HTML/CSS/JS sin dependencias externas.
- Estado de pedidos: un mismo `orders.json` guarda pedidos activos y completados mediante `status` y `completedAt`.

## Que falta o se podria ampliar despues

- Filtro por pedidos entregados hoy o por turno.
- Boton para reabrir un pedido entregado si se marcara por error.
- Generacion automatica de un QR fisico apuntando a la URL publica final.
- Despliegue en una URL de red local o internet para escaneo real desde movil.
