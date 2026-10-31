@echo off
title VaultEdge dev server
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
start "" http://localhost:5173/
npm run dev
if errorlevel 1 pause
