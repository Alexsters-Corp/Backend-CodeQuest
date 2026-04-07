# Backend-CodeQuest
Repositorio dedicado exclusivamente al Backend de la plataforma CodeQuest

## Setup de base de datos

- Schema base del monorepo: `../database/schema.sql`
- Schema incremental HU-007 (lecciones + progreso): `database/schema_user_progress.sql`

## Endpoint HU-007

- `GET /api/lessons/:id`
- Query opcionales:
	- `include_progress=true|false`
	- `include_navigation=true|false`

Reglas clave:

- Solo lecciones publicadas (`is_published = 1`)
- Si `is_free_demo = 1`, permite acceso sin token
- Si no es demo, requiere JWT y valida que la lección pertenezca a la ruta seleccionada del usuario
- Rate limit: 100 requests por hora (usuario autenticado o IP)

Documentación extendida:

- `docs/api/lessons.md`
