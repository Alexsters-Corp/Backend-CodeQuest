-- Expand Python curriculum for CodeQuest with optional primer and full progression.
-- Adapted from public curriculum structures and rewritten for this platform.

START TRANSACTION;

INSERT INTO learning_paths (
  programming_language_id, name, slug, description, difficulty_level, estimated_hours, is_optional, order_position, is_active
) VALUES
(1, 'Python Primer: Fundamentos previos', 'python-primer', 'Modulo opcional para estudiantes sin experiencia previa: consola, variables, flujo y lectura de errores antes de Python desde Cero.', 'principiante', 8, 1, 1, 1),
(1, 'Python desde Cero', 'python-basics', 'Aprende Python desde sintaxis base hasta funciones, colecciones y modulos.', 'principiante', 48, 0, 2, 1),
(1, 'Python Intermedio', 'python-intermediate', 'Domina archivos, errores, orientacion a objetos, generadores, paquetes y tipado.', 'intermedio', 62, 0, 3, 1),
(1, 'Python Avanzado', 'python-advanced', 'Profundiza en async, pruebas, calidad, rendimiento e integraciones modernas en Python.', 'avanzado', 74, 0, 4, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  difficulty_level = VALUES(difficulty_level),
  estimated_hours = VALUES(estimated_hours),
  is_optional = VALUES(is_optional),
  order_position = VALUES(order_position),
  is_active = VALUES(is_active);

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'es', name, description
FROM learning_paths
WHERE programming_language_id = 1
  AND slug IN ('python-primer', 'python-basics', 'python-intermediate', 'python-advanced')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'en',
  CASE slug
    WHEN 'python-primer' THEN 'Python Primer: First Concepts'
    WHEN 'python-basics' THEN 'Python from Scratch'
    WHEN 'python-intermediate' THEN 'Intermediate Python'
    WHEN 'python-advanced' THEN 'Advanced Python'
  END,
  CASE slug
    WHEN 'python-primer' THEN 'Optional support module for learners with no previous background: console, variables, flow, and debugging before Python from Scratch.'
    WHEN 'python-basics' THEN 'Learn Python from core syntax to functions, collections, and modules.'
    WHEN 'python-intermediate' THEN 'Master files, errors, object-oriented design, generators, packaging, and typing.'
    WHEN 'python-advanced' THEN 'Go deep into async workflows, testing, quality, performance, and modern integrations.'
  END
FROM learning_paths
WHERE programming_language_id = 1
  AND slug IN ('python-primer', 'python-basics', 'python-intermediate', 'python-advanced')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

CREATE TEMPORARY TABLE python_curriculum_seed (
  path_slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  order_position INT UNSIGNED NOT NULL,
  estimated_minutes INT UNSIGNED NOT NULL,
  xp_reward INT UNSIGNED NOT NULL,
  solution_code LONGTEXT NOT NULL,
  explanation TEXT NOT NULL,
  prompt TEXT NOT NULL,
  base_code TEXT NOT NULL
);

INSERT INTO python_curriculum_seed (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code
) VALUES
('python-primer', 'Como piensa Python: script y consola', 'python-primer-como-piensa',
 'Conceptos iniciales para entender como se ejecuta Python en archivos y en modo interactivo.',
 '<h2>Como piensa Python</h2><p>Python ejecuta instrucciones de arriba hacia abajo y permite practicar rapido en terminal o notebooks. El ciclo recomendado en CodeQuest es: escribir, ejecutar, observar salida y ajustar.</p><pre><code>print("Hola, CodeQuest")</code></pre>',
 1, 14, 25, 'print',
 'Usa print para mostrar informacion en consola.',
 'Completa la instruccion para imprimir Hola Python.',
 '_____ ("Hola Python")'),

('python-primer', 'Variables, tipos y asignacion', 'python-primer-variables-tipos',
 'Diferencia entre nombres, valores y tipos basicos en Python.',
 '<h2>Variables y tipos</h2><p>Python infiere tipos automaticamente. Lo importante al inicio es nombrar variables con intencion y verificar valores en cada paso.</p><pre><code>nombre = "Ada"
activo = True
puntos = 10</code></pre>',
 2, 15, 25, 'nombre',
 'nombre contiene el texto que se quiere imprimir.',
 'Completa el identificador para imprimir el nombre.',
 'nombre = "Ada"\nprint(_____)'),

('python-primer', 'Condiciones y bucles base', 'python-primer-condiciones-bucles',
 'Aprende if y for con ejemplos cortos de control de flujo.',
 '<h2>Condiciones y bucles</h2><p>Con if decides caminos. Con for repites una accion sobre una secuencia. Son dos pilares para resolver ejercicios de logica.</p><pre><code>for n in [1,2,3]:
    print(n)</code></pre>',
 3, 16, 25, 'for',
 'for recorre elementos de una secuencia.',
 'Completa la palabra clave para iterar la lista.',
 'numeros = [1,2,3]\n_____ n in numeros:\n    print(n)'),

('python-primer', 'Listas e indices', 'python-primer-listas-indices',
 'Entiende por que el primer indice es 0 y como leer posiciones.',
 '<h2>Listas e indices</h2><p>Una lista guarda elementos en orden. El primer elemento siempre esta en la posicion 0.</p><pre><code>temas = ["variables", "if", "for"]
print(temas[0])</code></pre>',
 4, 14, 25, '0',
 'El primer elemento de una lista se lee con indice 0.',
 'Completa el indice para leer el primer tema.',
 'temas = ["variables", "if", "for"]\nprint(temas[_____])'),

('python-primer', 'Lectura de errores y depuracion inicial', 'python-primer-errores',
 'Desarrolla el habito de leer traceback y corregir por pasos.',
 '<h2>Errores y depuracion</h2><p>Cuando Python falla, el traceback indica archivo, linea y tipo de error. Leer ese mensaje antes de cambiar codigo al azar acelera el aprendizaje.</p><pre><code>valor = 10
print(valor)</code></pre>',
 5, 16, 25, 'valor',
 'El identificador correcto evita NameError.',
 'Completa el identificador para evitar NameError.',
 'valor = 10\nprint(_____)'),

('python-basics', 'Introduccion a Python', 'python-introduccion',
 'Variables, tipos de datos y ejecucion de tu primer script en Python.',
 '<h2>Introduccion a Python</h2><p>Python destaca por su sintaxis clara y su ecosistema. En esta leccion trabajas variables, operaciones basicas y salida por consola para sentar una base solida.</p><pre><code>numeros = [1,2,3]
transformados = [n*2 for n in numeros]
print(transformados)</code></pre>',
 1, 18, 50, 'transformados',
 'transformados almacena la lista resultante.',
 'Completa el identificador para imprimir la lista transformada.',
 'numeros = [1,2,3]\ntransformados = [n*2 for n in numeros]\nprint(_____)'),

('python-basics', 'Sintaxis, indentacion y estilo', 'python-sintaxis-indentacion',
 'Domina la indentacion y convenciones minimas para codigo legible.',
 '<h2>Sintaxis e indentacion</h2><p>En Python la indentacion define bloques de codigo. Mantener un estilo consistente evita errores y facilita colaboracion.</p><pre><code>if True:
    print("bloque valido")</code></pre>',
 2, 18, 50, ':',
 'if en Python requiere dos puntos para abrir bloque.',
 'Completa el simbolo que abre el bloque if.',
 'if True_____\n    print("ok")'),

('python-basics', 'Strings y f-strings', 'python-strings-fstrings',
 'Formatea texto con f-strings y expresiones simples.',
 '<h2>Strings y formato</h2><p>Las f-strings permiten componer mensajes claros con variables y expresiones. Es la forma recomendada para salidas legibles.</p><pre><code>nombre = "Ada"
print(f"Hola {nombre}")</code></pre>',
 3, 18, 50, 'nombre',
 'Dentro de llaves se coloca el identificador a interpolar.',
 'Completa la f-string para imprimir el nombre.',
 'nombre = "Ada"\nprint(f"Hola {_____}")'),

('python-basics', 'Control de flujo y funciones', 'python-control-flujo-funciones',
 'Usa if, for, range y funciones para estructurar logica.',
 '<h2>Control de flujo y funciones</h2><p>Crear funciones pequenas mejora reuso y pruebas. Combinadas con bucles y condicionales permiten resolver tareas mas reales.</p><pre><code>def duplicar(x):
    return x*2
print(duplicar(4))</code></pre>',
 4, 20, 55, 'return',
 'return devuelve el resultado de la funcion.',
 'Completa la palabra clave para retornar el valor.',
 'def duplicar(x):\n    _____ x*2'),

('python-basics', 'Listas, diccionarios y conjuntos', 'python-colecciones-core',
 'Trabaja estructuras de datos esenciales para modelar informacion.',
 '<h2>Colecciones core</h2><p>Listas, diccionarios y sets cubren la mayoria de casos de almacenamiento en Python. Elegir la estructura correcta simplifica codigo.</p><pre><code>perfil = {"nombre": "Ada", "rol": "dev"}
print(perfil["rol"])</code></pre>',
 5, 20, 55, '"rol"',
 'La clave rol permite acceder al valor dev.',
 'Completa la clave para imprimir el rol.',
 'perfil = {"nombre": "Ada", "rol": "dev"}\nprint(perfil[_____])'),

('python-basics', 'Comprensiones y expresiones utiles', 'python-comprehensions',
 'Crea transformaciones compactas con list comprehensions.',
 '<h2>Comprensiones</h2><p>Las comprehensions permiten transformar y filtrar secuencias de forma expresiva.</p><pre><code>pares = [n for n in range(10) if n % 2 == 0]</code></pre>',
 6, 18, 55, 'for',
 'for es parte de la sintaxis de comprehension.',
 'Completa la palabra faltante en la comprehension.',
 'pares = [n _____ n in range(10) if n % 2 == 0]'),

('python-basics', 'Modulos e importacion', 'python-modulos-import',
 'Importa modulos de libreria estandar y organiza codigo reutilizable.',
 '<h2>Modulos e import</h2><p>Separar codigo en modulos facilita mantenimiento. Con import accedes a funcionalidades de la libreria estandar.</p><pre><code>import math
print(math.sqrt(16))</code></pre>',
 7, 18, 55, 'import',
 'import carga un modulo para usar sus funciones.',
 'Completa la palabra clave para cargar math.',
 '_____ math\nprint(math.sqrt(16))'),

('python-intermediate', 'Colecciones y funciones en Python', 'python-colecciones-funciones',
 'Listas, diccionarios, funciones y reutilizacion de logica en Python.',
 '<h2>Colecciones y funciones</h2><p>Esta leccion consolida estructuras y funciones para resolver transformaciones de datos sin repetir codigo.</p><pre><code>def saludar(nombre):
    return f"Hola {nombre}"
print(saludar("Ada"))</code></pre>',
 1, 22, 60, 'saludar',
 'saludar es la funcion que devuelve el mensaje.',
 'Completa el identificador para llamar la funcion.',
 'def saludar(nombre):\n    return f"Hola {nombre}"\nprint(_____("Ada"))'),

('python-intermediate', 'Archivos y JSON', 'python-files-json',
 'Lee y escribe archivos de texto y datos estructurados JSON.',
 '<h2>Archivos y JSON</h2><p>Muchos proyectos requieren persistir configuraciones o exportar resultados. JSON es un formato clave para intercambio de datos.</p><pre><code>import json
datos = {"curso": "python"}
texto = json.dumps(datos)</code></pre>',
 2, 24, 60, 'dumps',
 'json.dumps convierte diccionario a texto JSON.',
 'Completa el metodo para serializar a JSON.',
 'import json\ndatos = {"curso": "python"}\ntexto = json._____(datos)'),

('python-intermediate', 'Excepciones y context manager', 'python-exceptions-context',
 'Maneja errores con try/except y recursos con with.',
 '<h2>Excepciones y with</h2><p>Capturar errores evita caidas inesperadas. with asegura cierre correcto de archivos y recursos.</p><pre><code>try:
    x = 1/0
except ZeroDivisionError:
    print("error")</code></pre>',
 3, 24, 60, 'except',
 'except captura la excepcion esperada.',
 'Completa la palabra clave para capturar ZeroDivisionError.',
 'try:\n    x = 1/0\n_____ ZeroDivisionError:\n    print("error")'),

('python-intermediate', 'Clases, objetos y dataclasses', 'python-oop-dataclasses',
 'Aplica orientacion a objetos y modelos simples con dataclass.',
 '<h2>Clases y dataclasses</h2><p>Las clases encapsulan estado y comportamiento. dataclass reduce codigo repetitivo para entidades de datos.</p><pre><code>from dataclasses import dataclass
@dataclass
class Usuario:
    nombre: str</code></pre>',
 4, 24, 65, '@dataclass',
 'El decorador dataclass genera metodos utiles automaticamente.',
 'Completa el decorador para la clase Usuario.',
 'from dataclasses import dataclass\n_____\nclass Usuario:\n    nombre: str'),

('python-intermediate', 'Iteradores y generadores', 'python-iteradores-generadores',
 'Crea flujos perezosos con yield para procesar datos grandes.',
 '<h2>Iteradores y generadores</h2><p>Los generadores producen valores bajo demanda, reduciendo uso de memoria y mejorando escalabilidad.</p><pre><code>def contador(n):
    for i in range(n):
        yield i</code></pre>',
 5, 24, 65, 'yield',
 'yield produce un valor sin finalizar la funcion.',
 'Completa la palabra clave del generador.',
 'def contador(n):\n    for i in range(n):\n        _____ i'),

('python-intermediate', 'Paquetes, entornos virtuales y pip', 'python-packages-venv-pip',
 'Gestiona dependencias de forma aislada y reproducible.',
 '<h2>Entornos y paquetes</h2><p>Virtual environments evitan conflictos entre proyectos. pip permite instalar dependencias de forma controlada.</p><pre><code>python -m venv .venv
pip install requests</code></pre>',
 6, 22, 65, 'venv',
 'venv es el modulo estandar para crear entornos virtuales.',
 'Completa el modulo usado para crear entorno virtual.',
 'python -m _____ .venv'),

('python-intermediate', 'Tipado gradual y anotaciones', 'python-typing-anotaciones',
 'Usa type hints para mejorar claridad y soporte de herramientas.',
 '<h2>Tipado gradual</h2><p>Las anotaciones de tipo no cambian ejecucion, pero mejoran mantenibilidad y verificaciones estaticas.</p><pre><code>def sumar(a: int, b: int) -> int:
    return a + b</code></pre>',
 7, 22, 65, 'int',
 'int indica el tipo esperado de parametros y retorno.',
 'Completa la anotacion de retorno en la funcion.',
 'def sumar(a: int, b: int) -> _____:\n    return a + b'),

('python-advanced', 'Asyncio y concurrencia moderna', 'python-asyncio-concurrency',
 'Coordina tareas de I/O con async y await.',
 '<h2>Asyncio</h2><p>asyncio permite ejecutar tareas concurrentes para operaciones de red, API y colas de trabajo sin bloquear el hilo principal.</p><pre><code>import asyncio
async def tarea():
    await asyncio.sleep(1)</code></pre>',
 1, 28, 75, 'await',
 'await espera una coroutine dentro de una funcion async.',
 'Completa la palabra para esperar asyncio.sleep.',
 'import asyncio\nasync def tarea():\n    _____ asyncio.sleep(1)'),

('python-advanced', 'Testing con unittest y pytest', 'python-testing-unittest-pytest',
 'Construye pruebas repetibles para evitar regresiones.',
 '<h2>Testing</h2><p>Un buen flujo de pruebas valida comportamiento esperado y acelera refactors seguros. unittest viene con Python; pytest aporta ergonomia.</p><pre><code>def suma(a,b):
    return a+b
assert suma(2,2) == 4</code></pre>',
 2, 26, 75, 'assert',
 'assert valida una condicion esperada.',
 'Completa la palabra clave de validacion.',
 'def suma(a,b):\n    return a+b\n_____ suma(2,2) == 4'),

('python-advanced', 'Pattern matching con match/case', 'python-pattern-matching',
 'Modela decisiones complejas con match y case.',
 '<h2>Pattern matching</h2><p>Desde Python 3.10, match facilita lectura de ramas complejas comparado con multiples if anidados.</p><pre><code>def estado(codigo):
    match codigo:
        case 200:
            return "ok"</code></pre>',
 3, 24, 75, 'match',
 'match inicia la estructura de patrones.',
 'Completa la palabra clave para iniciar pattern matching.',
 'def estado(codigo):\n    _____ codigo:\n        case 200:\n            return "ok"'),

('python-advanced', 'Rendimiento y profiling', 'python-performance-profiling',
 'Mide antes de optimizar usando herramientas estandar.',
 '<h2>Rendimiento</h2><p>Optimizar sin medir genera falsas mejoras. Usa timeit y cProfile para detectar cuellos reales.</p><pre><code>import timeit
print(timeit.timeit("sum(range(100))", number=1000))</code></pre>',
 4, 24, 75, 'timeit',
 'timeit mide tiempos de ejecucion repetidos.',
 'Completa el modulo usado para medir tiempos.',
 'import _____\nprint(timeit.timeit("sum(range(100))", number=1000))'),

('python-advanced', 'Integracion de APIs y requests', 'python-api-requests',
 'Consume APIs HTTP y valida respuestas de forma robusta.',
 '<h2>Integracion de APIs</h2><p>Una gran parte del trabajo moderno en Python integra servicios externos. requests simplifica llamadas HTTP con buena legibilidad.</p><pre><code>import requests
r = requests.get("https://example.com")</code></pre>',
 5, 26, 80, 'get',
 'requests.get realiza una solicitud HTTP GET.',
 'Completa el metodo para solicitar la URL.',
 'import requests\nr = requests._____("https://example.com")'),

('python-advanced', 'Calidad, seguridad y linting', 'python-quality-security',
 'Integra validaciones de calidad y practicas de seguridad basicas.',
 '<h2>Calidad y seguridad</h2><p>Linters, formateadores y escaneo de dependencias reducen defectos y riesgos en produccion.</p><pre><code>python -m pip list --outdated</code></pre>',
 6, 24, 80, 'pip',
 'pip permite revisar e instalar dependencias del entorno.',
 'Completa el modulo de comando para listar paquetes.',
 'python -m _____ list --outdated'),

('python-advanced', 'Proyecto final: pipeline de datos', 'python-proyecto-final',
 'Integra lectura, transformacion, validacion y salida estructurada en un flujo ETL simple.',
 '<h2>Proyecto final</h2><p>Como cierre, construirás un mini pipeline que toma datos crudos, aplica reglas, captura errores y exporta resultados. Es un escenario cercano al trabajo real.</p><pre><code>filtrados = [x for x in datos if x["activo"]]
print(len(filtrados))</code></pre>',
 7, 35, 90, 'for',
 'La comprehension usa for para recorrer cada elemento.',
 'Completa la palabra faltante en la comprehension.',
 'filtrados = [x _____ x in datos if x["activo"]]\nprint(len(filtrados))');

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward
)
SELECT
  lp.id, seed.title, seed.slug, seed.description, seed.content,
  seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM python_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  content = VALUES(content),
  order_position = VALUES(order_position),
  estimated_minutes = VALUES(estimated_minutes),
  is_published = VALUES(is_published),
  is_ai_assisted = VALUES(is_ai_assisted),
  xp_reward = VALUES(xp_reward);

INSERT INTO lesson_solutions (
  lesson_id, language_id, solution_code, explanation, prompt, base_code
)
SELECT
  l.id, pl.id, seed.solution_code, seed.explanation, seed.prompt, seed.base_code
FROM python_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE
  language_id = VALUES(language_id),
  solution_code = VALUES(solution_code),
  explanation = VALUES(explanation),
  prompt = VALUES(prompt),
  base_code = VALUES(base_code);

DELETE ltc
FROM lesson_test_cases ltc
JOIN lessons l ON l.id = ltc.lesson_id
JOIN python_curriculum_seed seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica el concepto tecnico descrito en la leccion.', 0, 10, 1
FROM python_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe ejecutarse sin errores de sintaxis.', 0, 10, 2
FROM python_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Mantiene una salida clara para consola.', 1, 10, 3
FROM python_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE python_curriculum_seed;

COMMIT;
