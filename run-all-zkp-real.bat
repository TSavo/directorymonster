@echo off
set ZKP_USE_MOCKS=false
call npm run test:zkp:win -- --testNamePattern="should handle different case passwords|should handle different case usernames"
