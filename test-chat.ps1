$body = @{
    message = "你好，我想了解生命本质理论"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/ai/chat" -Method POST -ContentType "application/json" -Body $body
    Write-Host "成功！响应："
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "错误："
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}
