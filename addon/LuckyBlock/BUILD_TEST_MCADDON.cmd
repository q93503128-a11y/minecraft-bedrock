@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is required to build the Lucky Block test package.
  echo Install Node.js and run this file again.
  pause
  exit /b 1
)
node tools\build_mcaddon.mjs
if errorlevel 1 (
  echo.
  echo [FAILED] Preflight or packaging failed. No test build should be imported.
  pause
  exit /b 1
)
echo.
echo [OK] Test build created in: %CD%\dist
echo Import the *_TEST.mcaddon file into Minecraft Bedrock.
pause
