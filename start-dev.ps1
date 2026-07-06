$logFile = "C:\Users\Jakusa\Desktop\Vuka\.next\server.log"
$proc = Start-Process -FilePath "npx.cmd" -ArgumentList "next dev --port 3000" -WorkingDirectory "C:\Users\Jakusa\Desktop\Vuka" -WindowStyle Hidden -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile
Write-Output "Started dev server with PID: $($proc.Id)"
