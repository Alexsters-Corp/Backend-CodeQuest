# Lessons API

## GET /api/lessons/:id

Obtiene el contenido teorico de una leccion publicada, con metadatos opcionales de progreso y navegacion.

### Query params

- include_progress (boolean, default true)
- include_navigation (boolean, default true)

### Reglas de acceso

- Leccion no publicada o inexistente: 404 LESSON_NOT_FOUND
- Leccion demo (is_free_demo = true): acceso sin token
- Leccion premium: requiere JWT valido
- Usuario sin ruta seleccionada para el lenguaje: 403 NO_LEARNING_PATH
- Leccion fuera de la ruta seleccionada: 403 LESSON_NOT_IN_PATH
- Rate limit: 100 requests por hora por usuario/IP

### Respuesta base

```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": 15,
      "title": "Variables y Tipos de Datos en Python",
      "slug": "variables-tipos-datos-python",
      "description": "...",
      "content": "# Variables en Python ...",
      "order_position": 2,
      "estimated_minutes": 25,
      "xp_reward": 50,
      "is_free_demo": false,
      "learning_path": {
        "id": 1,
        "name": "Python desde Cero",
        "slug": "python-basics",
        "language": {
          "id": 1,
          "name": "Python",
          "display_name": "Python 3.11",
          "logo_url": "https://..."
        }
      }
    },
    "user_progress": {
      "status": "in_progress",
      "started_at": "2026-04-01T10:30:00.000Z",
      "completed_at": null,
      "xp_earned": 0,
      "submission_count": 2,
      "is_completed": false,
      "last_accessed_at": "2026-04-05T14:22:00.000Z"
    },
    "navigation": {
      "previous_lesson": null,
      "next_lesson": null
    }
  },
  "meta": {
    "accessed_at": "2026-04-05T14:22:00.000Z",
    "is_authenticated": true,
    "is_free_demo": false
  }
}
```

### Compatibilidad temporal

Se mantiene `lesson` y `exercises` en nivel raiz de respuesta para compatibilidad con frontend actual.
