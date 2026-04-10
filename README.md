# Sephora Cafe QR Menu MVP

Carta digital con dos vistas:

- Cliente: ` / `
- Barra: ` /barra `

El backend principal ahora es Node.js + Express, compatible con Linux, Codespaces y Render. Ya no depende de PowerShell para arrancar.

## Estructura

- `server.js`: servidor principal compatible con Linux/Render.
- `package.json`: dependencias y comandos de arranque.
- `public/`: frontend y assets estaticos.
- `data/orders.json`: persistencia simple de pedidos.

## Requisitos

- Node.js 18 o superior
- npm

## Arranque local

### Windows

```bash
npm install
npm start
```

### Linux

```bash
npm install
npm start
```

### Codespaces

```bash
npm install
npm start
```

La aplicacion arranca en:

- Cliente: `http://localhost:8080/`
- Barra: `http://localhost:8080/barra`

Si defines `PORT`, el servidor usara ese valor:

```bash
PORT=3000 npm start
```

En PowerShell:

```powershell
$env:PORT=3000
npm start
```

## Rutas

- `GET /`: vista cliente
- `GET /barra`: vista de barra
- `GET /api/menu`: menu inicial
- `GET /api/next-order-id`: siguiente identificador corto tipo `A-1`
- `GET /api/orders`: lista de pedidos
- `POST /api/orders`: crea un pedido
- `POST /api/orders/complete`: marca un pedido como entregado

## Persistencia

Los pedidos se guardan en `data/orders.json`.

No hace falta base de datos para el MVP, pero hay una limitacion importante en despliegue:

- En Render, el sistema de archivos puede ser efimero.
- Si reinicias o redespliegas el servicio, `data/orders.json` puede perderse.
- Para una demo sencilla puede ser suficiente.
- Si quieres persistencia real en Render, debes usar un Persistent Disk o una base de datos.

## Despliegue en Render

Tipo de servicio:

- `Web Service`

Entorno:

- `Node`

Build Command:

```bash
npm install
```

Start Command:

```bash
npm start
```

Root Directory:

- dejar vacio si el repo esta desplegado desde su raiz

Variables de entorno:

- no son obligatorias
- Render inyecta `PORT` automaticamente

## Flujo de prueba

### Cliente

1. Entra en ` / `
2. Selecciona cantidades
3. Verifica el identificador visible
4. Pulsa `ENVIAR`

### Barra

1. Abre ` /barra `
2. Observa pedidos activos en orden de llegada
3. Pulsa `Marcar como entregado`
4. Comprueba que pasa a `Completos y entregados`

## Notas de migracion

- `server.ps1` ha sido eliminado como via principal para evitar la dependencia de PowerShell.
- El flujo operativo ahora es estandar: `npm install` + `npm start`.
- El frontend visual no se ha refactorizado de mas; se ha conservado el producto actual.

## Limitaciones abiertas

- La persistencia sigue siendo un archivo JSON local.
- No hay autenticacion ni panel admin.
- No hay base de datos ni almacenamiento persistente gestionado.
