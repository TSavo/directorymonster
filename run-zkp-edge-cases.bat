@echo off
set ZKP_USE_MOCKS=false
call npm run test:zkp:win -- --testPathPattern=zkp-edge-cases.test.ts
