@echo off
echo ===================================================
echo Setting up Waste Segregation Monitoring System
echo ===================================================
echo.
echo Installing root development dependencies...
call npm install
echo.
echo Installing Backend dependencies...
cd backend
call npm install
echo.
echo Installing Frontend dependencies...
cd ../frontend
call npm install
echo.
echo ===================================================
echo Setup finished! Run run.bat to start the system.
echo ===================================================
pause
