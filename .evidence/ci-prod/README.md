# CI and Production Validation Evidence

Generated: 2026-05-22 03:51:04 -05:00

## CI-equivalent tests (same commands as workflow)
- auth-service: Test Suites: 4 passed, 4 total
- learning-service: Test Suites: 6 passed, 6 total
- api-gateway: Test Suites: 2 passed, 2 total
- ai-service: Test Suites: 2 passed, 2 total

Logs:
- .evidence/ci-prod/01-auth-service-test.log
- .evidence/ci-prod/02-learning-service-test.log
- .evidence/ci-prod/03-api-gateway-test.log
- .evidence/ci-prod/04-ai-service-test.log
- .evidence/ci-prod/09-command-exit-codes.log

## Production validation
### Direct run with current local env (failed as expected)
- command: docker compose -f docker-compose.prod.yml config
- result: failed because production env files are missing locally.
- evidence snippet:
env file C:\Users\fabim\OneDrive\Desktop\proyecto-de-software-3\Backend-CodeQuest\.env.auth not found
- full log: .evidence/ci-prod/05-docker-prod-config.log

### Safe dry-run with temporary placeholder env files (passed)
- command: docker compose -f docker-compose.prod.yml config
- setup: temporary .env.auth, .env.learning, .env.ai, .env.gateway created only for validation; DB vars set to non-secret dummy values.
- result: compose config resolved successfully.
- full log: .evidence/ci-prod/07-docker-prod-config-with-temp-env.log
- cleanup proof:
created_temp_files=.env.auth,.env.learning,.env.ai,.env.gateway
removed_temp_files=.env.auth,.env.learning,.env.ai,.env.gateway

## Notes for commit
- Include CI workflow change: .github/workflows/ci.yml
- Include evidence folder: .evidence/ci-prod/
- Do not include coverage artifacts under services/*/coverage
