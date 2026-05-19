# Backend-CodeQuest

Backend de CodeQuest en microservicios, organizado como monorepo con npm workspaces.

## Resumen ejecutivo

CodeQuest es una plataforma de aprendizaje gamificada para desarrolladores. Este backend provee:

- Autenticacion y seguridad con JWT (access/refresh), revocacion y roles.
- Motor de aprendizaje (rutas, lecciones, diagnostico, progreso, favoritos).
- Paneles de instructor y administrador (analytics y gestion).
- Integraciones externas (Groq para IA, Judge0 para ejecucion de codigo, SMTP).
- Gateway con rate limiting y ruteo centralizado para el frontend.

## Fin dentro del proyecto

El backend es la capa de dominio y orquestacion de CodeQuest. Sus objetivos dentro del proyecto:

- Garantizar autenticacion, autorizacion y control de acceso por rol.
- Centralizar el acceso del frontend mediante un gateway unico.
- Exponer un contrato API estable para el frontend y futuros clientes.
- Implementar la logica de negocio del aprendizaje y las herramientas AI.
- Proveer una base operativa escalable (observabilidad, health checks, migraciones controladas).

## Proyeccion (roadmap tecnico)

- Escalado horizontal de servicios con balanceo y autoescalado.
- Observabilidad avanzada (tracing distribuido, metrics y alertas).
- Cache distribuido para lecturas de alto impacto (dashboard, ranking).
- Pipelines de evaluacion y mejora continua para contenido AI.
- Aislamiento multi-tenant y segmentacion de datos por cohortes educativas.

## Arquitectura y flujo

### Flujo de peticion

1. Frontend llama siempre al gateway: `http://localhost:4000`.
2. Gateway valida JWT, rate limits y revocacion (token_blacklist / tokens_valid_after).
3. Gateway proxifica a `auth-service`, `learning-service` o `ai-service`.
4. En los servicios internos se exige `requireGatewayUser` cuando la ruta requiere usuario (x-user-\* headers).

### Servicios y responsabilidades

- **api-gateway (4000)**
  - Proxy HTTP a servicios internos.
  - Rate limiting global y por dominio (auth/learning).
  - Verificacion de JWT y revocacion (token_blacklist, tokens_valid_after).
  - Inyecta `x-user-id`, `x-user-email`, `x-user-role` a servicios internos protegidos.

- **auth-service (4001)**
  - Registro, login, refresh, logout, password reset.
  - Perfil de usuario, social graph, ranking.
  - Administracion de usuarios (admin).

- **learning-service (4002)**
  - Rutas de aprendizaje, lecciones, diagnostico y progreso.
  - Ejecucion de codigo via Judge0.
  - Favoritos, dashboard, modulos.
  - Panel de instructor y admin (analytics).

- **ai-service (4003)**
  - API propia de IA de CodeQuest.
  - Generacion de lecciones y ejercicios.
  - Validacion de calidad de contenido.
  - Evaluacion de respuestas y recomendaciones personalizadas.
  - Encapsula Groq Cloud como proveedor externo.

- **packages/shared**
  - AppError, handlers HTTP, JWT toolkit, DB pool, validaciones, guards.

## Estructura del monorepo

```
packages/
  shared/
services/
  api-gateway/
  auth-service/
  learning-service/
  ai-service/
database/
docs/
scripts/
```

## Contrato de red

- Frontend SIEMPRE consume el gateway: `http://localhost:4000`.
- Frontend NO debe llamar directo a `4001`, `4002` o `4003`.

Puertos institucionales:

- Backend: `4000-4099`
- Frontend: `5000-5099`

## API publica (gateway)

### Auth y usuarios (auth-service)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `GET /api/auth/me`
- `PATCH /api/auth/me/role` (admin)
- `GET /api/users/me`
- `GET /api/users/profile`
- `PUT /api/users/profile`

### Social y ranking (auth-service)

- `GET /api/social/search`
- `GET /api/social/directory`
- `POST /api/social/follow/:username`
- `DELETE /api/social/follow/:username`
- `GET /api/ranking/leaderboard`

### Learning (learning-service)

- `GET /api/learning/languages`
- `POST /api/learning/languages/select`
- `DELETE /api/learning/languages/:languageId`
- `GET /api/learning/languages/:languageId/modules`
- `POST /api/learning/diagnostic/start`
- `POST /api/learning/diagnostic/attempts/:attemptId/finish`
- `GET /api/learning/dashboard`
- `GET /api/learning/paths`
- `GET /api/learning/paths/:pathId`
- `GET /api/learning/paths/:pathId/lessons`
- `GET /api/learning/lessons/completed`
- `GET /api/learning/lessons/:lessonId`
- `GET /api/learning/lessons/:lessonId/session`
- `GET /api/learning/lessons/:lessonId/solution`
- `POST /api/learning/lessons/:lessonId/exercises/:exerciseId/submit`
- `POST /api/learning/lessons/:lessonId/submit`
- `GET /api/learning/progress/overview`
- `POST /api/learning/progress/lessons/:lessonId/complete`
- `POST /api/learning/execute`
- `GET /api/learning/favorites/paths`
- `POST /api/learning/favorites/paths/:pathId/toggle`
- `GET /api/learning/favorites/lessons`
- `POST /api/learning/favorites/lessons/:lessonId/toggle`

### Instructor (learning-service)

- `POST /api/instructor/classes`
- `GET /api/instructor/classes`
- `POST /api/instructor/classes/:id/invite`
- `POST /api/instructor/classes/:id/assign-path`
- `GET /api/instructor/classes/:id/analytics`

### Admin (learning-service + auth-service)

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `POST /api/admin/learning-paths`
- `GET /api/admin/analytics`

### AI (ai-service)

- `POST /api/admin/generate-lesson`
- `POST /api/admin/generate-exercise`
- `POST /api/admin/validate-content`
- `POST /api/learning/evaluate-explanation`
- `GET /api/learning/recommendations`

### Demo publico (learning-service)

- `GET /api/learning/demo/lesson`
- `GET /api/learning/demo/preview`
- `POST /api/learning/demo/lessons/:lessonId/exercises/:exerciseId/submit`
- `POST /api/learning/demo/execute`

## Tecnologias

- **Node.js + Express** (microservicios)
- **MariaDB** (persistencia principal)
- **Redis** (cache AI, soporte a features de baja latencia)
- **JWT** (auth y refresh)
- **http-proxy-middleware** (gateway)
- **express-rate-limit** (rate limiting)
- **Groq** (proveedor externo encapsulado por `ai-service`)
- **Judge0** (ejecucion de codigo)
- **Docker + Compose** (stack local)
- **npm workspaces** (monorepo)

## Seguridad y control de acceso

- JWT access/refresh con expiraciones configurables.
- Gateway valida revocacion via `token_blacklist` y campo `tokens_valid_after`.
- Autorizacion por rol usando `authorize` del paquete shared.
- CORS limitado al `FRONTEND_URL`.
- Rate limits: global 500/15m, auth 200/15m, learning 400/15m.

## Feature flags

- `FEATURE_LEARNING_PATHS`
- `FEATURE_LEARNING_LESSONS`
- `FEATURE_LEARNING_PROGRESS`
- `FEATURE_LEARNING_FAVORITES`
- `FEATURE_CODE_EXECUTION_ENABLED`
- `FEATURE_GUEST_ACCESS_ENABLED`
- `FEATURE_AI_CONTENT_ENABLED`
- `FEATURE_AI_EVALUATION_ENABLED`

## Configuracion (env)

Cada servicio tiene su `.env`.

### api-gateway

- `PORT`
- `FRONTEND_URL`
- `AUTH_SERVICE_URL`
- `LEARNING_SERVICE_URL`
- `AI_SERVICE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### auth-service

- DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT`
- JWT: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### learning-service

- DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT`
- Features: `FEATURE_*`
- Judge0: `JUDGE0_API_URL`, `JUDGE0_API_KEY`, `CODE_EXECUTION_TIMEOUT_MS`, `CODE_EXECUTION_MAX_CODE_LENGTH`

### ai-service

- DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT`
- Features: `FEATURE_AI_CONTENT_ENABLED`, `FEATURE_AI_EVALUATION_ENABLED`
- Judge0: `JUDGE0_API_URL`, `JUDGE0_API_KEY`, `CODE_EXECUTION_TIMEOUT_MS`
- AI: `GROQ_API_KEY`, `AI_MODEL_CONTENT_GENERATION`, `AI_MODEL_EVALUATION`, `AI_MODEL_SAFETY_CHECK`,
  `AI_MAX_RETRIES`, `AI_TIMEOUT_MS`
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

## Base de datos y migraciones

- MariaDB con `utf8mb4` y `utf8mb4_unicode_ci`.
- Migraciones incrementales en `database/*.sql`.
- El migrador registra en `schema_migrations` para evitar re-ejecucion.

## Quick start (local)

1. Instalar dependencias

```bash
npm install
```

2. Configurar variables de entorno

```bash
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/learning-service/.env.example services/learning-service/.env
```

3. Levantar servicios

```bash
npm run dev
```

Comandos utiles:

- `npm run dev:gateway`
- `npm run dev:auth`
- `npm run dev:learning`
- `npm run dev:ai`

4. Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health
```

## Docker

```bash
docker compose up -d --build
```

Incluye:

- MariaDB
- Redis
- db-migrator con `schema_migrations`
- Gateway, Auth, Learning y AI

## Observabilidad y operaciones

- Logs a stdout/stderr.
- Endpoints de health internos `/internal/health` para checks entre servicios.
- Limites de payload JSON: 1mb.

## Troubleshooting rapido

- **503 en AI**: `FEATURE_AI_CONTENT_ENABLED` en false, `GROQ_API_KEY` vacia o `ai-service` no disponible.
- **401 repetido**: refresh token invalido o revocacion (token_blacklist).
- **Error de DB**: revisar `DB_*` y estado de MariaDB/Redis.

## Migracion

Consulta `MIGRATION.md` o ejecuta:

```bash
bash scripts/migrate-to-monorepo.sh
```
