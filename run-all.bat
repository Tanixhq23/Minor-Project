@echo off
setlocal

set ROOT=%~dp0

start "backend" cmd /k "cd /d %ROOT%backend && npm install && npm start"
start "frontend" cmd /k "cd /d %ROOT%frontend && npm install && npm run dev"

endlocal
