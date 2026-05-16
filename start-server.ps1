$portInput = Read-Host "HTTP port (default 8080)"
$port = if ([string]::IsNullOrWhiteSpace($portInput)) { 8080 } else { [int]$portInput }

if ($port -lt 1 -or $port -gt 65535) {
  Write-Host "Port must be between 1 and 65535."
  exit 1
}

$url = "http://127.0.0.1:$port/"
Write-Host "Starting WAROGAN parser at $url"
Write-Host "Press Ctrl+C to stop the server."
python -m http.server $port
