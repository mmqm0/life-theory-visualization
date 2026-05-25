$body = @{
    message = "你好，请简单介绍一下你自己"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/ai/chat" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 10
