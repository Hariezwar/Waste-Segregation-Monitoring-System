@echo off
echo ===================================================
echo Starting Waste Segregation Monitoring System
echo ===================================================
echo.
echo Starting services (concurrent backend and frontend)...
call npm run dev
pause
