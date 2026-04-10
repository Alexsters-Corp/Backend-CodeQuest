-- Seed minimo e idempotente de lecciones publicadas para entorno local.
-- Objetivo: garantizar flujo funcional de onboarding -> modulos -> leccion.

INSERT INTO lessons (
  learning_path_id,
  title,
  slug,
  description,
  content,
  order_position,
  estimated_minutes,
  is_published,
  is_free_demo,
  xp_reward
)
SELECT
  1,
  'Introduccion a Python',
  'python-introduccion',
  'Variables, tipos de datos y ejecucion de tu primer script.',
  '<h2>Introduccion a Python</h2><p>Python es un lenguaje legible y versatil. En esta leccion veremos variables, tipos basicos y salida por consola.</p>',
  1,
  20,
  1,
  0,
  50
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 1 AND slug = 'python-introduccion'
);

INSERT INTO lessons (
  learning_path_id,
  title,
  slug,
  description,
  content,
  order_position,
  estimated_minutes,
  is_published,
  is_free_demo,
  xp_reward
)
SELECT
  2,
  'Colecciones y funciones en Python',
  'python-colecciones-funciones',
  'Listas, diccionarios y funciones reutilizables.',
  '<h2>Colecciones y funciones</h2><p>Aprenderas a estructurar datos y encapsular logica usando funciones.</p>',
  1,
  25,
  1,
  0,
  60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 2 AND slug = 'python-colecciones-funciones'
);

INSERT INTO lessons (
  learning_path_id,
  title,
  slug,
  description,
  content,
  order_position,
  estimated_minutes,
  is_published,
  is_free_demo,
  xp_reward
)
SELECT
  3,
  'Fundamentos de JavaScript',
  'js-fundamentos',
  'Tipos, funciones y manipulación basica de datos.',
  '<h2>Fundamentos de JavaScript</h2><p>Veremos sintaxis basica, funciones y buenas practicas iniciales.</p>',
  1,
  20,
  1,
  0,
  50
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 3 AND slug = 'js-fundamentos'
);

INSERT INTO lessons (
  learning_path_id,
  title,
  slug,
  description,
  content,
  order_position,
  estimated_minutes,
  is_published,
  is_free_demo,
  xp_reward
)
SELECT
  4,
  'Asincronia en JavaScript',
  'js-asincronia',
  'Promises, async/await y manejo de errores.',
  '<h2>Asincronia</h2><p>Aprenderas a trabajar con operaciones asincronas de forma clara y segura.</p>',
  1,
  30,
  1,
  0,
  70
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 4 AND slug = 'js-asincronia'
);

INSERT INTO lessons (
  learning_path_id,
  title,
  slug,
  description,
  content,
  order_position,
  estimated_minutes,
  is_published,
  is_free_demo,
  xp_reward
)
SELECT
  5,
  'Java: clases y objetos',
  'java-clases-objetos',
  'Introduccion a POO con Java.',
  '<h2>Clases y objetos</h2><p>Definiremos clases, atributos y metodos con ejemplos simples.</p>',
  1,
  25,
  1,
  0,
  60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 5 AND slug = 'java-clases-objetos'
);

INSERT INTO lessons (
  learning_path_id,
  title,
  slug,
  description,
  content,
  order_position,
  estimated_minutes,
  is_published,
  is_free_demo,
  xp_reward
)
SELECT
  6,
  'C++: sintaxis esencial',
  'cpp-sintaxis-esencial',
  'Variables, control de flujo y funciones en C++.',
  '<h2>Sintaxis esencial en C++</h2><p>Conoceras la estructura de un programa y elementos basicos del lenguaje.</p>',
  1,
  25,
  1,
  0,
  60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 6 AND slug = 'cpp-sintaxis-esencial'
);

INSERT INTO lessons (
  learning_path_id,
  title,
  slug,
  description,
  content,
  order_position,
  estimated_minutes,
  is_published,
  is_free_demo,
  xp_reward
)
SELECT
  7,
  'C# y .NET: primeros pasos',
  'csharp-dotnet-primeros-pasos',
  'Estructura de proyectos y tipos basicos en C#.',
  '<h2>Primeros pasos con C# y .NET</h2><p>Configuraras un proyecto simple y crearas tus primeras clases.</p>',
  1,
  25,
  1,
  0,
  60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 7 AND slug = 'csharp-dotnet-primeros-pasos'
);
