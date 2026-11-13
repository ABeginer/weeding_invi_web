$zipPath = 'C:\Users\thuan.ton\.gemini\antigravity\brain\7db10900-12c2-407b-992c-781c44f39459\.user_uploaded\media_1794544416520_a0a9733d.zip'
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead($zipPath).Entries | Select-Object FullName, Length

