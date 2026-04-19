-- ============================================================
-- Migración 09: Agrega prompt y base_code a lesson_solutions
-- Objetivo: mover el template del ejercicio de código al modelo
--           de datos para eliminar la dependencia del objeto
--           hardcodeado codeExerciseByLanguage en el servicio.
-- Idempotente: usa ADD COLUMN IF NOT EXISTS y UPDATE con WHERE.
-- ============================================================

ALTER TABLE lesson_solutions
  ADD COLUMN IF NOT EXISTS prompt    TEXT NULL COMMENT 'Enunciado del ejercicio de completar codigo' AFTER explanation,
  ADD COLUMN IF NOT EXISTS base_code TEXT NULL COMMENT 'Codigo con el espacio en blanco (_____)'     AFTER prompt;

-- ----------------------------------------------------------------
-- Poblar prompt y base_code para cada lección ya sembrada.
-- Solo actualiza filas que aun no tienen valor (migración segura).
-- ----------------------------------------------------------------

-- Lección 1: Introducción a Python — imprime la lista transformada
UPDATE lesson_solutions
SET
  prompt    = 'Completa el identificador faltante para imprimir la lista transformada en Python.',
  base_code = 'numeros = [1, 2, 3]\ndobles = [n * 2 for n in numeros]\nprint(_____)'
WHERE lesson_id = 1 AND (prompt IS NULL OR prompt = '');

-- Lección 2: Colecciones y funciones en Python — imprime resultado de función
UPDATE lesson_solutions
SET
  prompt    = 'Completa el identificador faltante para imprimir el resultado de la funcion en Python.',
  base_code = 'def calcular_dobles(numeros):\n    return [n * 2 for n in numeros]\nresultado = calcular_dobles([1, 2, 3])\nprint(_____)'
WHERE lesson_id = 2 AND (prompt IS NULL OR prompt = '');

-- Lección 3: Fundamentos de JavaScript — imprime el array transformado con map
UPDATE lesson_solutions
SET
  prompt    = 'Completa el identificador faltante para mostrar el resultado en JavaScript.',
  base_code = 'const numeros = [1, 2, 3]\nconst dobles = numeros.map((n) => n * 2)\nconsole.log(_____)'
WHERE lesson_id = 3 AND (prompt IS NULL OR prompt = '');

-- Lección 4: Asincronía en JavaScript — imprime el array en contexto async
UPDATE lesson_solutions
SET
  prompt    = 'Completa el identificador faltante para mostrar el array en el ejemplo asincrono.',
  base_code = 'const dobles = [2, 4, 6]\nconsole.log(_____)'
WHERE lesson_id = 4 AND (prompt IS NULL OR prompt = '');

-- Lección 5: Java — imprime la variable String
UPDATE lesson_solutions
SET
  prompt    = 'Completa el identificador faltante para imprimir el mensaje en Java.',
  base_code = 'String mensaje = "Hola CodeQuest";\nSystem.out.println(_____);'
WHERE lesson_id = 5 AND (prompt IS NULL OR prompt = '');

-- Lección 6: C++ — muestra la variable calculada con cout
UPDATE lesson_solutions
SET
  prompt    = 'Completa el identificador faltante para mostrar el resultado en C++.',
  base_code = 'int total = 2 + 3;\nstd::cout << _____ << std::endl;'
WHERE lesson_id = 6 AND (prompt IS NULL OR prompt = '');

-- Lección 7: C# — imprime la variable con Console.WriteLine
UPDATE lesson_solutions
SET
  prompt    = 'Completa el identificador faltante para imprimir el resultado en C#.',
  base_code = 'int total = 2 + 3;\nConsole.WriteLine(_____);'
WHERE lesson_id = 7 AND (prompt IS NULL OR prompt = '');
