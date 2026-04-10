# Backend-CodeQuest

Backend de CodeQuest migrado a microservicios limpios en monorepo con npm workspaces.

## Arquitectura

- `packages/shared`: utilidades compartidas (`AppError`, handlers HTTP, JWT toolkit, DB pool, validaciones, auth guard)
- `services/api-gateway`: puerto `4000`
- `services/auth-service`: puerto `4001`
- `services/learning-service`: puerto `4002`

Contrato de consumo:

- Frontend siempre llama a `http://localhost:4000`
- Gateway enruta internamente a `auth-service` y `learning-service`
- Frontend no debe llamar directamente a `4001` o `4002`

Contrato API limpio (sin rutas legacy):

- Auth:
	- `POST /api/auth/register`
	- `POST /api/auth/login`
	- `POST /api/auth/refresh`
	- `POST /api/auth/logout`
	- `POST /api/auth/forgot-password`
	- `POST /api/auth/reset-password`
	- `GET /api/users/me`
- Learning:
	- `GET /api/learning/languages`
	- `POST /api/learning/languages/select`
	- `POST /api/learning/diagnostic/start`
	- `POST /api/learning/diagnostic/attempts/:attemptId/finish`
	- `GET /api/learning/dashboard`
	- `GET /api/learning/languages/:languageId/modules`
	- `GET /api/learning/paths`
	- `GET /api/learning/paths/:pathId`
	- `GET /api/learning/paths/:pathId/lessons`
	- `GET /api/learning/lessons/:lessonId`
	- `GET /api/learning/lessons/:lessonId/session`
	- `POST /api/learning/lessons/:lessonId/exercises/:exerciseId/submit`
	- `GET /api/learning/progress/overview`
	- `POST /api/learning/progress/lessons/:lessonId/complete`

Rutas removidas del contrato publico:

- `/api/languages`
- `/api/diagnostic/*`
- `/api/lessons/*`
- `/api/progress/*`

Nota:

- El diagnostico ahora vive bajo `/api/learning/diagnostic/*` (no bajo `/api/diagnostic/*`).

## Puertos institucionales

- Backend: `4000-4099`
- Frontend: `5000-5099`

## Quick Start

1. Instalar dependencias

```bash
npm install
```

2. Configurar variables de entorno por servicio

```bash
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/learning-service/.env.example services/learning-service/.env
```

3. Levantar servicios en desarrollo

```bash
npm run dev
```

4. Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
```

## Docker

```bash
docker compose up -d --build
```

Incluye:

- MariaDB con `utf8mb4` + `utf8mb4_unicode_ci`
- Redis
- Gateway, Auth y Learning

Seed de contenido:

- `database/seed_lessons.sql` agrega lecciones publicadas minimas para flujo funcional local.
- En base limpia (sin volumen previo), Docker las aplica automaticamente al inicializar MariaDB.
- En bases existentes, aplica `database/migration_add_diagnostic_attempts.sql` para habilitar diagnostico persistente.

## Migracion

Consulta `MIGRATION.md` o ejecuta:

```bash
bash scripts/migrate-to-monorepo.sh
```
