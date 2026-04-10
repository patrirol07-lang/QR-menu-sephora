$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Web.Extensions

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PublicDirectory = Join-Path $ProjectRoot "public"
$DataDirectory = Join-Path $ProjectRoot "data"
$OrdersFile = Join-Path $DataDirectory "orders.json"
$ServerPort = 8080
$JsonSerializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer

function Normalize-Orders {
    param(
        [AllowEmptyCollection()]
        [object[]]$Orders
    )

    if ($null -eq $Orders -or $Orders.Count -eq 0) {
        return @()
    }

    return @(
        $Orders | ForEach-Object {
            $rawItems = @($_["items"])

            [ordered]@{
                orderId = [string]$_["orderId"]
                createdAt = [string]$_["createdAt"]
                status = if ([string]::IsNullOrWhiteSpace([string]$_["status"])) { "active" } else { [string]$_["status"] }
                completedAt = [string]$_["completedAt"]
                items = @(
                    $rawItems | ForEach-Object {
                        [ordered]@{
                            id = [string]$_["id"]
                            name = [string]$_["name"]
                            category = [string]$_["category"]
                            quantity = [int]$_["quantity"]
                        }
                    }
                )
            }
        }
    )
}

function Ensure-ProjectFiles {
    if (-not (Test-Path -LiteralPath $PublicDirectory)) {
        New-Item -ItemType Directory -Path $PublicDirectory | Out-Null
    }

    if (-not (Test-Path -LiteralPath $DataDirectory)) {
        New-Item -ItemType Directory -Path $DataDirectory | Out-Null
    }

    if (-not (Test-Path -LiteralPath $OrdersFile)) {
        "[]" | Set-Content -LiteralPath $OrdersFile -Encoding UTF8
    }
}

function Get-Menu {
    return @(
        @{
            category = "CAFE"
            items = @(
                @{
                    id = "golden-hour-macchiato"
                    name = "Golden Hour Macchiato"
                    description = "Cafe con leche, curcuma y un toque de canela."
                },
                @{
                    id = "glitter-iced-latte"
                    name = "Glitter Iced Latte"
                    description = "Cafe con leche frio, sirope de vainilla y purpurina dorada comestible."
                },
                @{
                    id = "pink-clay-mocha"
                    name = "Pink Clay Mocha"
                    description = "Moca de chocolate blanco con sirope de frambuesa."
                }
            )
        },
        @{
            category = "MATCHA"
            items = @(
                @{
                    id = "cloud-matcha-latte"
                    name = "Cloud Matcha Latte"
                    description = "Matcha ceremonial con espuma fria de leche infusionada con taro."
                },
                @{
                    id = "strawberry-glow-matcha"
                    name = "Strawberry Glow Matcha"
                    description = "Pure de fresas naturales, leche de coco y matcha servido en capas."
                }
            )
        },
        @{
            category = "REFRESCOS"
            items = @(
                @{
                    id = "watermelon-spritz"
                    name = "Watermelon Spritz"
                    description = "Zumo de sandia, lima y borde con sal negra."
                },
                @{
                    id = "dragon-fruit-serum"
                    name = "Dragon Fruit Serum"
                    description = "Limonada con agua de coco y un toque de granadina."
                }
            )
        },
        @{
            category = "COCTELES"
            items = @(
                @{
                    id = "sephora-spritz"
                    name = "Sephora Spritz"
                    description = "Aperol, soda de pomelo rosa y borde de azucar de fresa."
                },
                @{
                    id = "black-diamond-martini"
                    name = "Black Diamond Martini"
                    description = "Vodka y zumo de mora negra, decorado con brocheta de arandanos."
                }
            )
        }
    )
}

function Read-Orders {
    $raw = Get-Content -LiteralPath $OrdersFile -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }

    $parsed = $JsonSerializer.DeserializeObject($raw)
    if ($null -eq $parsed) {
        return @()
    }

    return Normalize-Orders -Orders @($parsed)
}

function Save-Orders {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Orders
    )

    $JsonSerializer.Serialize($Orders) |
        Set-Content -LiteralPath $OrdersFile -Encoding UTF8
}

function Get-ContentType {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { return "text/html" }
        ".css" { return "text/css" }
        ".js" { return "application/javascript" }
        ".json" { return "application/json" }
        default { return "text/plain" }
    }
}

function Get-StatusDescription {
    param(
        [Parameter(Mandatory = $true)]
        [int]$StatusCode
    )

    switch ($StatusCode) {
        200 { return "OK" }
        201 { return "Created" }
        400 { return "Bad Request" }
        404 { return "Not Found" }
        405 { return "Method Not Allowed" }
        500 { return "Internal Server Error" }
        default { return "OK" }
    }
}

function Send-Response {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client,

        [Parameter(Mandatory = $true)]
        [string]$Body,

        [Parameter(Mandatory = $true)]
        [string]$ContentType,

        [int]$StatusCode = 200
    )

    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $headers = @(
        "HTTP/1.1 $StatusCode $(Get-StatusDescription -StatusCode $StatusCode)",
        "Content-Type: $ContentType; charset=utf-8",
        "Content-Length: $($bodyBytes.Length)",
        "Connection: close"
    ) -join "`r`n"

    $responseBytes = [System.Text.Encoding]::UTF8.GetBytes("$headers`r`n`r`n")
    $stream = $Client.GetStream()
    $stream.Write($responseBytes, 0, $responseBytes.Length)
    $stream.Write($bodyBytes, 0, $bodyBytes.Length)
    $stream.Flush()
}

function Send-JsonResponse {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client,

        [Parameter(Mandatory = $true)]
        [object]$Payload,

        [int]$StatusCode = 200
    )

    Send-Response -Client $Client -Body ($JsonSerializer.Serialize($Payload)) -ContentType "application/json" -StatusCode $StatusCode
}

function Resolve-StaticFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RequestPath
    )

    switch ($RequestPath) {
        "/" { return (Join-Path $PublicDirectory "index.html") }
        "/barra" { return (Join-Path $PublicDirectory "barra.html") }
        default {
            $trimmedPath = $RequestPath.TrimStart("/")
            if ([string]::IsNullOrWhiteSpace($trimmedPath)) {
                return $null
            }

            $publicRoot = [System.IO.Path]::GetFullPath($PublicDirectory)
            $candidate = [System.IO.Path]::GetFullPath((Join-Path $PublicDirectory $trimmedPath))

            if ($candidate.StartsWith($publicRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                return $candidate
            }

            return $null
        }
    }
}

function Read-HttpRequest {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client
    )

    $stream = $Client.GetStream()
    $stream.ReadTimeout = 5000

    $buffer = New-Object byte[] 4096
    $memory = New-Object System.IO.MemoryStream
    $headerText = $null
    $headerEndIndex = -1

    while ($headerEndIndex -lt 0) {
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        if ($bytesRead -le 0) {
            throw "No se recibio una peticion HTTP valida."
        }

        $memory.Write($buffer, 0, $bytesRead)
        $headerText = [System.Text.Encoding]::UTF8.GetString($memory.ToArray())
        $headerEndIndex = $headerText.IndexOf("`r`n`r`n", [System.StringComparison]::Ordinal)
    }

    $allBytes = $memory.ToArray()
    $headersPart = [System.Text.Encoding]::UTF8.GetString($allBytes, 0, $headerEndIndex)
    $lines = $headersPart -split "`r`n"
    $requestLine = $lines[0].Split(" ")

    $headers = @{}
    foreach ($line in $lines[1..($lines.Length - 1)]) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $separatorIndex = $line.IndexOf(":")
        if ($separatorIndex -gt 0) {
            $headerName = $line.Substring(0, $separatorIndex).Trim()
            $headerValue = $line.Substring($separatorIndex + 1).Trim()
            $headers[$headerName] = $headerValue
        }
    }

    $contentLength = 0
    if ($headers.ContainsKey("Content-Length")) {
        $contentLength = [int]$headers["Content-Length"]
    }

    $bodyStartIndex = $headerEndIndex + 4
    $bodyBytes = New-Object byte[] $contentLength
    $bytesAlreadyRead = [Math]::Max(0, $allBytes.Length - $bodyStartIndex)

    if ($bytesAlreadyRead -gt 0) {
        [System.Array]::Copy($allBytes, $bodyStartIndex, $bodyBytes, 0, [Math]::Min($bytesAlreadyRead, $contentLength))
    }

    $offset = [Math]::Min($bytesAlreadyRead, $contentLength)
    while ($offset -lt $contentLength) {
        $read = $stream.Read($bodyBytes, $offset, $contentLength - $offset)
        if ($read -le 0) {
            break
        }
        $offset += $read
    }

    $requestTarget = $requestLine[1]
    $path = $requestTarget.Split("?")[0]

    return @{
        Method = $requestLine[0].ToUpperInvariant()
        Path = $path
        Headers = $headers
        Body = [System.Text.Encoding]::UTF8.GetString($bodyBytes)
    }
}

function Handle-OrdersPost {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client,

        [Parameter(Mandatory = $true)]
        [hashtable]$Request
    )

    if ([string]::IsNullOrWhiteSpace($Request.Body)) {
        Send-JsonResponse -Client $Client -Payload @{ error = "El cuerpo de la peticion esta vacio." } -StatusCode 400
        return
    }

    try {
        $payload = $JsonSerializer.DeserializeObject($Request.Body)
    }
    catch {
        Send-JsonResponse -Client $Client -Payload @{ error = "El JSON recibido no es valido." } -StatusCode 400
        return
    }

    $items = @($payload["items"] | Where-Object { [int]$_["quantity"] -gt 0 })

    if (-not $payload["orderId"] -or $items.Count -eq 0) {
        Send-JsonResponse -Client $Client -Payload @{ error = "El pedido debe incluir un identificador y al menos una bebida." } -StatusCode 400
        return
    }

    $orders = @(Read-Orders)
    $newOrder = [ordered]@{
        orderId = [string]$payload["orderId"]
        createdAt = (Get-Date).ToString("o")
        status = "active"
        completedAt = $null
        items = @(
            $items | ForEach-Object {
                [ordered]@{
                    id = [string]$_["id"]
                    name = [string]$_["name"]
                    category = [string]$_["category"]
                    quantity = [int]$_["quantity"]
                }
            }
        )
    }

    $updatedOrders = @()
    $updatedOrders += @($orders)
    $updatedOrders += ,$newOrder

    Save-Orders -Orders $updatedOrders
    Send-JsonResponse -Client $Client -Payload @{ success = $true; order = $newOrder } -StatusCode 201
}

function Handle-OrdersCompletePost {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client,

        [Parameter(Mandatory = $true)]
        [hashtable]$Request
    )

    if ([string]::IsNullOrWhiteSpace($Request.Body)) {
        Send-JsonResponse -Client $Client -Payload @{ error = "El cuerpo de la peticion esta vacio." } -StatusCode 400
        return
    }

    try {
        $payload = $JsonSerializer.DeserializeObject($Request.Body)
    }
    catch {
        Send-JsonResponse -Client $Client -Payload @{ error = "El JSON recibido no es valido." } -StatusCode 400
        return
    }

    $orderId = [string]$payload["orderId"]
    if ([string]::IsNullOrWhiteSpace($orderId)) {
        Send-JsonResponse -Client $Client -Payload @{ error = "Debes indicar el identificador del pedido." } -StatusCode 400
        return
    }

    $orders = @(Read-Orders)
    $updatedOrders = @()
    $found = $false
    $completedOrder = $null

    foreach ($order in $orders) {
        $updatedOrder = [ordered]@{
            orderId = [string]$order["orderId"]
            createdAt = [string]$order["createdAt"]
            status = [string]$order["status"]
            completedAt = [string]$order["completedAt"]
            items = @(
                @($order["items"]) | ForEach-Object {
                    [ordered]@{
                        id = [string]$_["id"]
                        name = [string]$_["name"]
                        category = [string]$_["category"]
                        quantity = [int]$_["quantity"]
                    }
                }
            )
        }

        if (-not $found -and $updatedOrder["orderId"] -eq $orderId -and $updatedOrder["status"] -ne "completed") {
            $updatedOrder["status"] = "completed"
            $updatedOrder["completedAt"] = (Get-Date).ToString("o")
            $found = $true
            $completedOrder = $updatedOrder
        }

        $updatedOrders += $updatedOrder
    }

    if (-not $found) {
        Send-JsonResponse -Client $Client -Payload @{ error = "No se encontro un pedido activo con ese identificador." } -StatusCode 404
        return
    }

    Save-Orders -Orders $updatedOrders
    Send-JsonResponse -Client $Client -Payload @{ success = $true; order = $completedOrder } -StatusCode 200
}

function Handle-ApiRequest {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client,

        [Parameter(Mandatory = $true)]
        [hashtable]$Request
    )

    switch ($Request.Path) {
        "/api/menu" {
            $categoriesJson = $JsonSerializer.Serialize([object[]](Get-Menu))
            Send-Response -Client $Client -Body "{""categories"":$categoriesJson}" -ContentType "application/json"
            return
        }
        "/api/orders/complete" {
            if ($Request.Method -eq "POST") {
                Handle-OrdersCompletePost -Client $Client -Request $Request
                return
            }

            Send-JsonResponse -Client $Client -Payload @{ error = "Metodo no permitido." } -StatusCode 405
            return
        }
        "/api/orders" {
            if ($Request.Method -eq "GET") {
                $orders = Normalize-Orders -Orders @(Read-Orders | Sort-Object { $_["createdAt"] })
                if ($null -eq $orders) {
                    $orderList = Write-Output -NoEnumerate ([object[]]@())
                }
                else {
                    $orderList = Write-Output -NoEnumerate ([object[]]$orders)
                }
                $ordersJson = $JsonSerializer.Serialize($orderList)
                Send-Response -Client $Client -Body "{""orders"":$ordersJson}" -ContentType "application/json"
                return
            }

            if ($Request.Method -eq "POST") {
                Handle-OrdersPost -Client $Client -Request $Request
                return
            }

            Send-JsonResponse -Client $Client -Payload @{ error = "Metodo no permitido." } -StatusCode 405
            return
        }
        default {
            Send-JsonResponse -Client $Client -Payload @{ error = "Ruta API no encontrada." } -StatusCode 404
            return
        }
    }
}

function Handle-StaticRequest {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client,

        [Parameter(Mandatory = $true)]
        [hashtable]$Request
    )

    $filePath = Resolve-StaticFile -RequestPath $Request.Path
    if (-not $filePath -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Send-Response -Client $Client -Body "404 - Recurso no encontrado" -ContentType "text/plain" -StatusCode 404
        return
    }

    $content = Get-Content -LiteralPath $filePath -Raw
    Send-Response -Client $Client -Body $content -ContentType (Get-ContentType -Path $filePath)
}

function Handle-Client {
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Sockets.TcpClient]$Client
    )

    try {
        $request = Read-HttpRequest -Client $Client

        if ($request.Path.StartsWith("/api/", [System.StringComparison]::OrdinalIgnoreCase)) {
            Handle-ApiRequest -Client $Client -Request $request
        }
        else {
            Handle-StaticRequest -Client $Client -Request $request
        }
    }
    catch {
        Send-JsonResponse -Client $Client -Payload @{
            error = "Se ha producido un error interno."
            detail = $_.Exception.Message
        } -StatusCode 500
    }
    finally {
        $Client.Close()
    }
}

function Start-Server {
    Ensure-ProjectFiles

    $listener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback, $ServerPort)
    $listener.Start()

    Write-Host ""
    Write-Host "Carta digital lista para demo"
    Write-Host "Cliente: http://localhost:$ServerPort/"
    Write-Host "Barra:   http://localhost:$ServerPort/barra"
    Write-Host ""
    Write-Host "Pulsa Ctrl+C para detener el servidor."

    try {
        while ($true) {
            $client = $listener.AcceptTcpClient()
            Handle-Client -Client $client
        }
    }
    finally {
        $listener.Stop()
    }
}

Start-Server
