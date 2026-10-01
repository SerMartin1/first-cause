@echo off
rem Uruchamia FIRST CAUSE w trybie deweloperskim (pnpm dev).
rem Okno konsoli musi zostac otwarte, dopoki gra dziala.
cd /d "%~dp0"
title FIRST CAUSE
call pnpm dev
if errorlevel 1 (
  echo.
  echo Uruchomienie nie powiodlo sie. Sprawdz komunikaty powyzej.
  pause
)
