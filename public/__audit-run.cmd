@echo off
setlocal
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
set URL="http://localhost:3000/__overflow-audit.html?w=320,360,375,390,412,480,600,768,820,912,1024,1280,1366,1440,1600&p=/&p=/shop&p=/hand-painted&p=/printed-canvas&p=/categories&p=/categories/nature&p=%%2Fsearch%%3Fq%%3Dmountain&p=/cart&p=/checkout&p=/about&p=/contact&p=/login&p=/register&p=/wishlist&p=/account&p=/admin&p=/__overflow-control.html"
set OUT=%~dp0audit-dom.txt
set ERR=%~dp0audit-err.txt
echo STARTED > "%~dp0audit-done.txt"
%CHROME% --headless=new --disable-gpu --no-sandbox --no-first-run --user-data-dir="%TEMP%\chrome-audit" --dump-dom --virtual-time-budget=120000 --window-size=1700,1200 %URL% > "%OUT%" 2> "%ERR%"
echo EXITCODE=%ERRORLEVEL% >> "%~dp0audit-done.txt"