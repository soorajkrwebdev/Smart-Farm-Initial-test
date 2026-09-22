$ErrorActionPreference = 'Stop'
$l = Get-Content d:\FarmNexa\.env
$url = (($l | Where-Object { $_ -match '^VITE_SUPABASE_URL=' }) -replace 'VITE_SUPABASE_URL=', '').Trim()
$key = (($l | Where-Object { $_ -match '^VITE_SUPABASE_ANON_KEY=' }) -replace 'VITE_SUPABASE_ANON_KEY=', '').Trim()
Write-Host "url=[$url] keyLen=$($key.Length)"
if ($url -and $key.Length -gt 8) {
    $probes = @(
      '{"label":"KA-page0-50","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[state]":"Karnataka","limit":"50","offset":"0"},"groupBy":["state","commodity"],"sampleLimit":30}',
      '{"label":"KA-page1-50","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[state]":"Karnataka","limit":"50","offset":"50"},"groupBy":["state","commodity"],"sampleLimit":30}',
      '{"label":"NATIONAL-page0-50","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"limit":"50","offset":"0"},"groupBy":["state","commodity"],"sampleLimit":40}',
      '{"label":"NATIONAL-page1-50","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"limit":"50","offset":"50"},"groupBy":["state","commodity"],"sampleLimit":40}',
      '{"label":"KA-total","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[state]":"Karnataka","limit":"1","offset":"0"},"sampleLimit":0}',
      '{"label":"NATIONAL-total","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"limit":"1","offset":"0"},"sampleLimit":0}',
      '{"label":"KA-coconut-exact","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[state]":"Karnataka","filters[commodity]":"Coconut","limit":"10"},"sampleLimit":3}',
      '{"label":"KA-arecanut-exact","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[state]":"Karnataka","filters[commodity]":"Arecanut","limit":"10"},"sampleLimit":3}',
      '{"label":"KA-pepper-exact","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[state]":"Karnataka","filters[commodity]":"Black Pepper","limit":"10"},"sampleLimit":3}',
      '{"label":"NATIONAL-coconut-exact","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[commodity]":"Coconut","limit":"10"},"sampleLimit":3}',
      '{"label":"NATIONAL-arecanut-exact","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[commodity]":"Arecanut","limit":"10"},"sampleLimit":3}',
      '{"label":"NATIONAL-pepper-exact","path":"resource/9ef84268-d588-465a-a308-a864a43d0070","params":{"filters[commodity]":"Black Pepper","limit":"10"},"sampleLimit":3}',
    )
    $body = '{"probes":[' + ($probes -join ',') + ']}'
    Write-Host "probes=[$([string]::Join(',', $probes)))]"
    Invoke-RestMethod -Method POST -Uri ('{0}/functions/v1/market-feed-diagnostic' -f $url) -Headers @{ Authorization = 'Bearer ' + $key; 'Content-Type' = 'application/json' } -Body $body -TimeoutSec 120 | ConvertTo-Json -Depth 6
} else {
    Write-Host 'missing creds'
}
