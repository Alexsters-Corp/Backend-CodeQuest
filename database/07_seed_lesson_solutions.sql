-- ============================================================
-- Migración 07: Seed de lesson_solutions y lesson_test_cases
-- Objetivo: sacar el codeExerciseByLanguage del código JS
--           y persistirlo en la base de datos.
-- Idempotente: usa INSERT IGNORE para no duplicar.
-- ============================================================

-- ------------------------------------------------------------
-- lesson_solutions: solución esperada por lección + lenguaje
-- ------------------------------------------------------------

-- Lección 1: Introducción a Python (learning_path_id=1, language_id=1)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (1, 1, 'dobles', 'Imprimir la variable que almacena la lista transformada');

-- Lección 2: Colecciones y funciones en Python (learning_path_id=2, language_id=1)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (2, 1, 'dobles', 'Imprimir la lista transformada con comprensión de lista');

-- Lección 3: Fundamentos de JavaScript (learning_path_id=3, language_id=2)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (3, 2, 'dobles', 'Mostrar el arreglo transformado con map()');

-- Lección 4: Asincronía en JavaScript (learning_path_id=4, language_id=2)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (4, 2, 'dobles', 'Mostrar el resultado del arreglo transformado');

-- Lección 5: Java clases y objetos (learning_path_id=5, language_id=3)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (5, 3, 'mensaje', 'Imprimir la variable que contiene el texto');

-- Lección 6: C++ sintaxis esencial (learning_path_id=6, language_id=4)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (6, 4, 'total', 'Usar el nombre de la variable calculada previamente');

-- Lección 7: C# y .NET primeros pasos (learning_path_id=7, language_id=5)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (7, 5, 'total', 'Imprimir la variable que guarda la suma');

-- ------------------------------------------------------------
-- lesson_test_cases: 3 casos por lección
-- 2 visibles + 1 oculto, 10 puntos cada uno
-- ------------------------------------------------------------

-- Lección 1 (Python básico)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (1, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 1),
  (1, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 2),
  (1, 'numeros = [1, 2, 3]', 'dobles', 1, 10, 3);

-- Lección 2 (Python intermedio)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (2, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 1),
  (2, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 2),
  (2, 'numeros = [1, 2, 3]', 'dobles', 1, 10, 3);

-- Lección 3 (JavaScript esencial)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (3, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 1),
  (3, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 2),
  (3, 'numeros = [1, 2, 3]', 'dobles', 1, 10, 3);

-- Lección 4 (JavaScript avanzado)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (4, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 1),
  (4, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 2),
  (4, 'numeros = [1, 2, 3]', 'dobles', 1, 10, 3);

-- Lección 5 (Java)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (5, 'mensaje = "Hola CodeQuest"', 'mensaje', 0, 10, 1),
  (5, 'mensaje = "Hola CodeQuest"', 'mensaje', 0, 10, 2),
  (5, 'mensaje = "Hola CodeQuest"', 'mensaje', 1, 10, 3);

-- Lección 6 (C++)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (6, 'total = 2 + 3', 'total', 0, 10, 1),
  (6, 'total = 2 + 3', 'total', 0, 10, 2),
  (6, 'total = 2 + 3', 'total', 1, 10, 3);

-- Lección 7 (C#)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (7, 'total = 2 + 3', 'total', 0, 10, 1),
  (7, 'total = 2 + 3', 'total', 0, 10, 2),
  (7, 'total = 2 + 3', 'total', 1, 10, 3);
