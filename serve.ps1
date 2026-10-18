$ErrorActionPreference = "Stop"
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8000)
$listener.Start()
Write-Host "LIVE STOCK is running at http://localhost:8000"
Write-Host "Press Ctrl+C to stop the local server."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while (($headerLine = $reader.ReadLine()) -ne "") { }

      $requestPath = "/"
      if ($requestLine) {
        $parts = $requestLine.Split(" ")
        if ($parts.Length -ge 2) { $requestPath = $parts[1].Split("?")[0] }
      }
      $relativePath = [Uri]::UnescapeDataString($requestPath.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
      $target = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relativePath))

      if (-not $target.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $status = "404 Not Found"
        $contentType = "text/plain; charset=utf-8"
        $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      } else {
        $status = "200 OK"
        $body = [System.IO.File]::ReadAllBytes($target)
        $contentType = switch ([System.IO.Path]::GetExtension($target).ToLowerInvariant()) {
          ".html" { "text/html; charset=utf-8" }
          ".js" { "text/javascript; charset=utf-8" }
          ".css" { "text/css; charset=utf-8" }
          ".svg" { "image/svg+xml" }
          default { "application/octet-stream" }
        }
      }

      $responseHeaders = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($responseHeaders)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
