#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'
$force = $Args.Length -ge 1
Write-Host "force=$force"

$l = Get-Content d:\FarmNexa\.env
$url = (($l | Where-Object { $_ -match '^VITE_SUPABASE_URL=' } | Select-Object -First 1).Split('=',2)[1].Trim())
$key = (($l | Where-Object { $_ -match '^VITE_SUPABASE_ANON_KEY=' } | Select-Object -First 1).Split('=',2)[1].Trim())
$diagnostic = "$url/functions/v1/market-feed-diagnostic"

$bodyObj = [ordered]@{
  probes = @(
    [ordered]@{ label = 'unfiltered-full-crop-check'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 0 }
    [ordered]@{ label = 'karnataka-crop-check-offset0'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 0; filters = @{ state = 'Karnataka' } }
    [ordered]@{ label = 'karnataka-crop-check-offset1000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 1000; filters = @{ state = 'Karnataka' } }
    [ordered]@{ label = 'karnataka-crop-check-offset2000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 2000; filters = @{ state = 'Karnataka' } }
    [ordered]@{ label = 'karnataka-crop-check-offset3000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 3000; filters = @{ state = 'Karnataka' } }
    [ordered]@{ label = 'karnataka-crop-check-offset4000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 4000; filters = @{ state = 'Karnataka' } }
    [ordered]@{ label = 'karnataka-crop-check-offset5000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 5000; filters = @{ state = 'Karnataka' } }
    [ordered]@{ label = 'blackpepper-karnataka-offset0'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 120; filters = @{ Commodity = 'Black pepper'; state = 'Karnataka' } }
    [ordered]@{ label = 'blackpepper-karnataka-offset1000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 1120; filters = @{ Commodity = 'Black pepper'; state = 'Karnataka' } }
    [ordered]@{ label = 'blackpepper-karnataka-offset2000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 2120; filters = @{ Commodity = 'Black pepper'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecanut-simple-karnataka-offset0'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 0; filters = @{ Commodity = 'Arecanut'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecanut-simple-karnataka-offset1000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 1000; filters = @{ Commodity = 'Arecanut'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecanut-simple-karnataka-offset2000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 2000; filters = @{ Commodity = 'Arecanut'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecananut-betelnut-karnataka-offset0'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 0; filters = @{ Commodity = 'Arecanut(Betelnut/Supari)'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecananut-betelnut-karnataka-offset1000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 1000; filters = @{ Commodity = 'Arecanut(Betelnut/Supari)'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecananut-betelnut-karnataka-offset2000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 2000; filters = @{ Commodity = 'Arecanut(Betelnut/Supari)'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecananut-betelnut-karnataka-offset3000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 3000; filters = @{ Commodity = 'Arecanut(Betelnut/Supari)'; state = 'Karnataka' } }
    [ordered]@{ label = 'arecananut-betelnut-karnataka-offset4000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 4000; filters = @{ Commodity = 'Arecanut(Betelnut/Supari)'; state = 'Karnataka' } }
    [ordered]@{ label = 'coconut-karnataka-offset0'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 0; filters = @{ Commodity = 'Coconut'; state = 'Karnataka' } }
    [ordered]@{ label = 'coconut-karnataka-offset1000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 1000; filters = @{ Commodity = 'Coconut'; state = 'Karnataka' } }
    [ordered]@{ label = 'coconut-karnataka-offset2000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 2000; filters = @{ Commodity = 'Coconut'; state = 'Karnataka' } }
    [ordered]@{ label = 'coconut-karnataka-offset3000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 3000; filters = @{ Commodity = 'Coconut'; state = 'Karnataka' } }
    [ordered]@{ label = 'coconut-karnataka-offset4000'; resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; format = 'json'; limit = 1000; offset = 4000; filters = @{ Commodity = 'Coconut'; state = 'Karnataka' } }
  )
}

Write-Host 'Sending probe batch...'
$json = $bodyObj | ConvertTo-Json -Depth 6
Invoke-RestMethod -Uri $diagnostic -Method Post -Headers @{ Authorization = "Bearer $key"; 'Content-Type' = 'application/json' } -Body $json -TimeoutSec 240 -ErrorAction Stop | ConvertTo-Json -Depth 6 | Set-Content d:\FarmNexa\tmp-crop-probe-result.json -Encoding utf8
Write-Host 'Probe batch complete.'
