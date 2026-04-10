# Migracion a Monorepo de Microservicios Limpios

Este backend ya esta preparado con workspaces y servicios en puertos institucionales:

- API Gateway: 4000
- Auth Service: 4001
- Learning Service: 4002

## 1) Backup de datos actuales

```bash
mysqldump -h localhost -P 3306 -u root codequest learning_paths > backups/learning_paths.sql
```

## 2) Instalar dependencias

```bash
npm install
```

## 3) Configurar variables de entorno

```bash
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/learning-service/.env.example services/learning-service/.env
```

Asegura que `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` sean iguales en gateway y auth-service.

## 4) Levantar stack completo

```bash
docker compose up -d --build
```

## 5) Verificar salud

```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
```

## 6) Verificar rutas existentes de learning_paths

```bash
curl http://localhost:4000/api/learning/paths
```

## 7) Seed de lecciones (solo si tu base ya existia)

Si tu volumen de MariaDB ya existia antes de esta migracion, aplica el seed minimo una vez:

```bash
docker exec -i codequest-mariadb mariadb -uroot -pcodequest codequest < database/seed_lessons.sql
```

## 8) Frontend

El frontend debe usar solo:

```env
VITE_API_URL=http://localhost:4000
```

No consumas puertos 4001/4002 directamente desde frontend.

Contrato publico actual (sin legacy):

- `/api/auth/*`
- `/api/users/me`
- `/api/learning/*`

No usar rutas antiguas como `/api/languages`, `/api/diagnostic`, `/api/lessons` o `/api/progress`.
