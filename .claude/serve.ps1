# Static file server for local preview (no Node or Python needed); started by .claude/launch.json.
# Uses TcpListener: HttpListener depends on http.sys, which cannot start in the preview environment.
# Keep this file ASCII-only: Windows PowerShell 5.1 reads BOM-less files as ANSI.
param([string]$Root = '.', [int]$Port = 5173)
$Root = [IO.Path]::GetFullPath((Resolve-Path $Root))
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.json'='application/json'; '.md'='text/plain; charset=utf-8'; '.txt'='text/plain; charset=utf-8' }
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/"
while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    # Browsers open speculative connections that never send a request; drop them instead of blocking every other request.
    $stream.ReadTimeout = 2000
    $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 4096, $true)
    $line = $reader.ReadLine()
    while ($reader.ReadLine()) {}
    $status = '200 OK'; $body = [byte[]]@(); $type = 'text/plain'
    if ($line -match '^(GET|HEAD) (\S+)') {
      $path = [Uri]::UnescapeDataString(($Matches[2] -split '\?')[0].TrimStart('/'))
      if ($path -eq '') { $path = 'index.html' }
      $file = [IO.Path]::GetFullPath((Join-Path $Root $path))
      if ($file.StartsWith($Root) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
        $body = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file).ToLower()
        if ($types[$ext]) { $type = $types[$ext] } else { $type = 'application/octet-stream' }
      } else { $status = '404 Not Found' }
      if ($Matches[1] -eq 'HEAD') { $length = $body.Length; $body = [byte[]]@() } else { $length = $body.Length }
    } else { $status = '405 Method Not Allowed'; $length = 0 }
    $head = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $length`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n")
    $stream.Write($head, 0, $head.Length)
    if ($body.Length) { $stream.Write($body, 0, $body.Length) }
    $stream.Flush()
  } catch {} finally { $client.Close() }
}
