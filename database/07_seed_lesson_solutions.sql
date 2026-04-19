-- ============================================================
-- Migración 07: Seed de lesson_solutions y lesson_test_cases
-- Objetivo: persistir en BD los datos que antes vivian en el
--           objeto hardcodeado codeExerciseByLanguage del servicio.
-- Idempotente: usa INSERT IGNORE para no duplicar.
-- ============================================================

-- ------------------------------------------------------------
-- lesson_solutions: respuesta esperada y explicacion por lección
-- solution_code → identificador que el alumno debe escribir
-- explanation   → pista que se muestra si la respuesta es incorrecta
-- ------------------------------------------------------------

-- Lección 1: Introducción a Python (language_id=1)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (1, 1, 'dobles', 'Debes imprimir la variable que almacena la lista transformada por comprension de lista.');

-- Lección 2: Colecciones y funciones en Python (language_id=1)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (2, 1, 'resultado', 'Imprime la variable que guarda el valor de retorno de la funcion calcular_dobles().');

-- Lección 3: Fundamentos de JavaScript (language_id=2)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (3, 2, 'dobles', 'Usa el nombre de la constante que contiene el array transformado con map().');

-- Lección 4: Asincronía en JavaScript (language_id=2)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (4, 2, 'dobles', 'Imprime la variable que contiene los valores duplicados definida en el ejemplo de async/await.');

-- Lección 5: Java clases y objetos (language_id=3)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (5, 3, 'mensaje', 'Pasa a System.out.println() la variable que contiene el texto de saludo.');

-- Lección 6: C++ sintaxis esencial (language_id=4)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (6, 4, 'total', 'Usa la variable declarada con el resultado de la suma 2 + 3.');

-- Lección 7: C# y .NET primeros pasos (language_id=5)
INSERT IGNORE INTO lesson_solutions (lesson_id, language_id, solution_code, explanation)
VALUES (7, 5, 'total', 'Pasa a Console.WriteLine() la variable que almacena el resultado de la operacion.');

-- ------------------------------------------------------------
-- lesson_test_cases: 3 casos por lección (2 visibles + 1 oculto)
-- Cada caso vale 10 puntos.
-- ------------------------------------------------------------

-- Lección 1 (Introducción a Python)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (1, 'numeros = [1, 2, 3]', 'dobles', 0, 10, 1),
  (1, 'numeros = [4, 5, 6]', 'dobles', 0, 10, 2),
  (1, 'numeros = [0, 1]',    'dobles', 1, 10, 3);

-- Lección 2 (Colecciones y funciones en Python)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (2, 'numeros = [1, 2, 3]', 'resultado', 0, 10, 1),
  (2, 'numeros = [4, 5, 6]', 'resultado', 0, 10, 2),
  (2, 'numeros = [0, 1]',    'resultado', 1, 10, 3);

-- Lección 3 (Fundamentos de JavaScript)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (3, 'const numeros = [1, 2, 3]', 'dobles', 0, 10, 1),
  (3, 'const numeros = [4, 5, 6]', 'dobles', 0, 10, 2),
  (3, 'const numeros = [0, 1]',    'dobles', 1, 10, 3);

-- Lección 4 (Asincronía en JavaScript)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (4, 'const dobles = [2, 4, 6]', 'dobles', 0, 10, 1),
  (4, 'const dobles = [8, 10]',   'dobles', 0, 10, 2),
  (4, 'const dobles = [0, 2]',    'dobles', 1, 10, 3);

-- Lección 5 (Java: clases y objetos)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (5, 'String mensaje = "Hola CodeQuest"', 'mensaje', 0, 10, 1),
  (5, 'String mensaje = "Aprendiendo Java"', 'mensaje', 0, 10, 2),
  (5, 'String mensaje = "POO en Java"',      'mensaje', 1, 10, 3);

-- Lección 6 (C++: sintaxis esencial)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (6, 'int total = 2 + 3', 'total', 0, 10, 1),
  (6, 'int total = 10 + 5', 'total', 0, 10, 2),
  (6, 'int total = 0 + 1',  'total', 1, 10, 3);

-- Lección 7 (C# y .NET: primeros pasos)
INSERT IGNORE INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
VALUES
  (7, 'int total = 2 + 3', 'total', 0, 10, 1),
  (7, 'int total = 7 + 8', 'total', 0, 10, 2),
  (7, 'int total = 1 + 1', 'total', 1, 10, 3);
