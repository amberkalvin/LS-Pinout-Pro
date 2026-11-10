@echo off
title LS / LT Swap Pinout Master Launcher
set "APP_HTML=%~dp0LS_Swap_Pinout_Master.html"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%APP_HTML:\=/%" --window-size=1500,940
    exit /b 0
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="file:///%APP_HTML:\=/%" --window-size=1500,940
    exit /b 0
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="file:///%APP_HTML:\=/%" --window-size=1500,940
    exit /b 0
)
start "" "%APP_HTML%"
