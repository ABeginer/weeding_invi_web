$zipPath = 'C:\Users\thuan.ton\.gemini\antigravity\brain\7db10900-12c2-407b-992c-781c44f39459\.user_uploaded\media_1794544416520_a0a9733d.zip'
$outPath = 'C:\Users\thuan.ton\Desktop\wedding_invi_web\scratch\p2-backend-preview'
Expand-Archive -Path $zipPath -DestinationPath $outPath -Force
Get-ChildItem -Recurse $outPath | Select-Object FullName

