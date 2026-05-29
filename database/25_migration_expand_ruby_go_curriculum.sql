-- Expand Ruby and Go curriculum with optional primer modules and broader modern coverage.
-- Content is adapted for CodeQuest from public topic progression patterns; no source text is copied.

START TRANSACTION;

INSERT INTO learning_paths (
  programming_language_id, name, slug, description, difficulty_level, estimated_hours, is_optional, order_position, is_active
) VALUES
(7, 'Ruby Primer: Fundamentos previos', 'ruby-primer', 'Modulo opcional para estudiantes sin experiencia previa: vocabulario, sintaxis, consola y lectura de errores antes de Ruby desde Cero.', 'principiante', 8, 1, 1, 1),
(7, 'Ruby desde Cero', 'ruby-basics', 'Aprende Ruby desde la sintaxis esencial hasta colecciones, condicionales y automatizacion inicial.', 'principiante', 48, 0, 2, 1),
(7, 'Ruby Intermedio', 'ruby-intermediate', 'Domina metodos, bloques, clases, modulos, archivos, JSON y organizacion practica de proyectos Ruby.', 'intermedio', 60, 0, 3, 1),
(7, 'Ruby Avanzado', 'ruby-advanced', 'Profundiza en metaprogramacion, concurrencia moderna, APIs, pruebas y optimizacion en Ruby.', 'avanzado', 72, 0, 4, 1),
(6, 'Go Primer: Fundamentos previos', 'go-primer', 'Modulo opcional para estudiantes sin experiencia previa: estructura de archivos, compilacion, tipos e indices antes de Go desde Cero.', 'principiante', 8, 1, 1, 1),
(6, 'Go desde Cero', 'go-basics', 'Aprende Go desde la sintaxis esencial hasta control de flujo, funciones y colecciones fundamentales.', 'principiante', 48, 0, 2, 1),
(6, 'Go Intermedio', 'go-intermediate', 'Domina slices, maps, structs, interfaces, modulos y organizacion de codigo en Go.', 'intermedio', 60, 0, 3, 1),
(6, 'Go Avanzado', 'go-advanced', 'Profundiza en concurrencia, genericos, contexto, pruebas, seguridad y servicios modernos en Go.', 'avanzado', 72, 0, 4, 1)
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
WHERE slug IN ('ruby-primer', 'ruby-basics', 'ruby-intermediate', 'ruby-advanced', 'go-primer', 'go-basics', 'go-intermediate', 'go-advanced')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'en',
  CASE slug
    WHEN 'ruby-primer' THEN 'Ruby Primer: First Concepts'
    WHEN 'ruby-basics' THEN 'Ruby from Scratch'
    WHEN 'ruby-intermediate' THEN 'Intermediate Ruby'
    WHEN 'ruby-advanced' THEN 'Advanced Ruby'
    WHEN 'go-primer' THEN 'Go Primer: First Concepts'
    WHEN 'go-basics' THEN 'Go from Scratch'
    WHEN 'go-intermediate' THEN 'Intermediate Go'
    WHEN 'go-advanced' THEN 'Advanced Go'
  END,
  CASE slug
    WHEN 'ruby-primer' THEN 'Optional module for learners with no prior background: vocabulary, syntax, console, and debugging before Ruby from Scratch.'
    WHEN 'ruby-basics' THEN 'Learn Ruby from essential syntax to collections, conditionals, and early automation patterns.'
    WHEN 'ruby-intermediate' THEN 'Master methods, blocks, classes, modules, files, JSON, and practical Ruby project structure.'
    WHEN 'ruby-advanced' THEN 'Go deep into metaprogramming, modern concurrency, APIs, testing, and Ruby optimization.'
    WHEN 'go-primer' THEN 'Optional module for learners with no prior background: file structure, compilation, types, and indexes before Go from Scratch.'
    WHEN 'go-basics' THEN 'Learn Go from essential syntax to control flow, functions, and foundational collections.'
    WHEN 'go-intermediate' THEN 'Master slices, maps, structs, interfaces, modules, and Go code organization.'
    WHEN 'go-advanced' THEN 'Go deep into concurrency, generics, context, testing, security, and modern services in Go.'
  END
FROM learning_paths
WHERE slug IN ('ruby-primer', 'ruby-basics', 'ruby-intermediate', 'ruby-advanced', 'go-primer', 'go-basics', 'go-intermediate', 'go-advanced')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

CREATE TEMPORARY TABLE ruby_refresh (
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
  base_code TEXT NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  content_en LONGTEXT NOT NULL,
  explanation_en TEXT NOT NULL,
  prompt_en TEXT NOT NULL
);

INSERT INTO ruby_refresh (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code, title_en, description_en, content_en, explanation_en, prompt_en
) VALUES
('ruby-primer', 'Como piensa Ruby: scripts, IRB y salida', 'ruby-primer-como-piensa', 'Conceptos base para entender que ejecuta Ruby, donde practicar y como observar resultados en consola.', '<h2>Como piensa Ruby</h2><p>Ruby ejecuta instrucciones de arriba hacia abajo y favorece una sintaxis legible. Antes de entrar a clases o metaprogramacion, conviene dominar un archivo <code>.rb</code>, una consola interactiva como <code>irb</code> y la salida en pantalla.</p><pre><code>puts "Hola, CodeQuest"</code></pre>', 1, 15, 25, 'puts', 'Usa <code>puts</code> cuando quieras imprimir una linea completa con salto final.', 'Completa la instruccion para imprimir "Hola, Ruby" en consola.', '_____ "Hola, Ruby"', 'How Ruby thinks: scripts, IRB, and output', 'Core ideas to understand what Ruby executes, where to practice, and how to observe console output.', '<h2>How Ruby thinks</h2><p>Ruby executes instructions top to bottom and favors readable syntax. Before classes or metaprogramming, it helps to understand a <code>.rb</code> file, an interactive console such as <code>irb</code>, and screen output.</p><pre><code>puts "Hello, CodeQuest"</code></pre>', 'Use <code>puts</code> when you want to print a full line with a trailing newline.', 'Complete the instruction to print "Hola, Ruby" to the console.'),
('ruby-primer', 'Variables, objetos y tipos base', 'ruby-primer-variables-objetos', 'Introduce nombres, referencias y la idea central de Ruby: casi todo es un objeto.', '<h2>Variables, objetos y tipos base</h2><p>En Ruby una variable guarda una referencia a un objeto. Un numero, un texto o un booleano comparten una misma idea: todos responden a metodos.</p><pre><code>lenguaje = "Ruby"; puts lenguaje.class</code></pre>', 2, 15, 25, 'class', 'El metodo <code>class</code> devuelve la clase del objeto almacenado en la variable.', 'Completa la llamada para mostrar la clase del valor guardado en "lenguaje".', 'lenguaje = "Ruby"; puts lenguaje._____', 'Variables, objects, and core types', 'Introduce names, references, and Ruby''s central idea: nearly everything is an object.', '<h2>Variables, objects, and core types</h2><p>In Ruby a variable stores a reference to an object. A number, a string, or a boolean share the same idea: they all respond to methods.</p><pre><code>language = "Ruby"; puts language.class</code></pre>', 'The <code>class</code> method returns the class of the object stored in the variable.', 'Complete the call to show the class of the value stored in "lenguaje".'),
('ruby-primer', 'Strings, interpolacion y entrada simple', 'ruby-primer-strings-interpolacion', 'Trabaja con texto, combinacion de valores y lectura de datos basica.', '<h2>Strings e interpolacion</h2><p>Con comillas dobles puedes interpolar variables usando <code>#{}</code>, lo que vuelve mas expresivos los mensajes y reportes.</p><pre><code>nombre = "Ada"; puts "Hola, #{nombre}"</code></pre>', 3, 15, 25, 'nombre', 'Dentro de <code>#{}</code> se coloca el identificador que quieres evaluar.', 'Completa la interpolacion para saludar usando la variable "nombre".', 'nombre = "Ada"; puts "Hola, #{_____}"', 'Strings, interpolation, and simple input', 'Work with text, combine values, and understand basic input flows.', '<h2>Strings and interpolation</h2><p>With double quotes you can interpolate variables using <code>#{}</code>, which makes messages and reports more expressive.</p><pre><code>name = "Ada"; puts "Hello, #{name}"</code></pre>', 'Inside <code>#{}</code> you place the identifier you want Ruby to evaluate.', 'Complete the interpolation to greet using the variable "nombre".'),
('ruby-primer', 'Arrays, hashes e indices', 'ruby-primer-colecciones', 'Entiende colecciones ordenadas y estructuras clave-valor desde el primer contacto.', '<h2>Arrays, hashes e indices</h2><p>Los arrays guardan elementos en orden y los hashes relacionan claves con valores. Son estructuras esenciales para representar listados, configuraciones y respuestas de servicios.</p><pre><code>perfil = { nivel: "base", lenguaje: "Ruby" }; puts perfil[:nivel]</code></pre>', 4, 15, 25, ':nivel', 'En un hash con claves simbolo, debes consultar usando ese mismo simbolo.', 'Completa la clave para imprimir el nivel del perfil.', 'perfil = { nivel: "base", lenguaje: "Ruby" }; puts perfil[_____]', 'Arrays, hashes, and indexes', 'Understand ordered collections and key-value structures from the first contact.', '<h2>Arrays, hashes, and indexes</h2><p>Arrays store ordered elements and hashes map keys to values. They are essential in Ruby for representing lists, configuration, and service responses.</p><pre><code>profile = { level: "base", language: "Ruby" }; puts profile[:level]</code></pre>', 'When a hash uses symbol keys, query it with that same symbol.', 'Complete the key to print the profile level.'),
('ruby-primer', 'Bloques, end y lectura de errores', 'ruby-primer-bloques-end', 'Reconoce la estructura de los bloques y desarrolla el habito de leer el error antes de corregir.', '<h2>Bloques y errores comunes</h2><p>Ruby abre y cierra muchas estructuras con la palabra clave <code>end</code>. Ese detalle explica buena parte de los errores frecuentes de sintaxis cuando recien empiezas.</p><pre><code>3.times do; puts "Practica"; end</code></pre>', 5, 15, 25, 'end', 'La palabra <code>end</code> cierra el bloque abierto por <code>do</code> o por una definicion.', 'Completa el cierre del bloque iterador.', '3.times do; puts "Practica"; _____', 'Blocks, end, and error reading', 'Recognize block structure and build the habit of reading errors before fixing code.', '<h2>Blocks and common errors</h2><p>Ruby opens and closes many structures with the <code>end</code> keyword. That detail explains many early syntax errors.</p><pre><code>3.times do; puts "Practice"; end</code></pre>', 'The <code>end</code> keyword closes a block opened by <code>do</code> or by a definition.', 'Complete the iterator block closing keyword.'),
('ruby-intermediate', 'Archivos, JSON y persistencia ligera', 'ruby-archivos-json', 'Lee y escribe datos simples en disco, y transforma estructuras Ruby a JSON y viceversa.', '<h2>Archivos, JSON y persistencia ligera</h2><p>Muchos scripts Ruby resuelven tareas de automatizacion: leer un archivo, transformar su contenido y generar una salida nueva. Para intercambiar informacion con otros sistemas, el formato mas frecuente es JSON.</p><pre><code>require "json"; puts JSON.generate({ curso: "Ruby" })</code></pre>', 8, 26, 65, 'generate', 'Usa <code>JSON.generate</code> para convertir un hash Ruby en una cadena JSON.', 'Completa la llamada que serializa el hash a JSON.', 'require "json"; datos = { curso: "Ruby" }; puts JSON._____(datos)', 'Files, JSON, and light persistence', 'Read and write simple files, and transform Ruby data structures to and from JSON.', '<h2>Files, JSON, and light persistence</h2><p>Many Ruby scripts solve automation tasks: read a file, transform its content, and produce a new output. To exchange information with other systems, JSON is one of the most common formats.</p><pre><code>require "json"; puts JSON.generate({ course: "Ruby" })</code></pre>', 'Use <code>JSON.generate</code> to convert a Ruby hash into a JSON string.', 'Complete the call that serializes the hash to JSON.'),
('ruby-intermediate', 'Expresiones regulares y parsing textual', 'ruby-regex-parsing', 'Procesa texto estructurado con patrones, validaciones y extraccion de datos.', '<h2>Expresiones regulares</h2><p>Ruby cuenta con un motor muy practico para buscar patrones dentro de cadenas. Las expresiones regulares sirven para validar formatos, localizar errores repetidos y extraer datos de logs o archivos.</p><pre><code>correo = "ada@codequest.dev"; puts /@/.match?(correo)</code></pre>', 9, 24, 65, 'match?', 'El metodo <code>match?</code> devuelve verdadero o falso segun encuentre coincidencia con el patron.', 'Completa la llamada que valida si el correo contiene el patron indicado.', 'correo = "ada@codequest.dev"; puts /@/._____(correo)', 'Regular expressions and text parsing', 'Process structured text with patterns, validation, and data extraction.', '<h2>Regular expressions</h2><p>Ruby has a practical engine for finding patterns inside strings. Regular expressions are useful for validating formats, locating repeated errors, and extracting data from logs or files.</p><pre><code>email = "ada@codequest.dev"; puts /@/.match?(email)</code></pre>', 'The <code>match?</code> method returns true or false depending on whether the pattern matches.', 'Complete the call that validates whether the email contains the given pattern.'),
('ruby-intermediate', 'Bundler, Gems y organizacion del proyecto', 'ruby-bundler-gems', 'Comprende como Ruby administra dependencias y por que un proyecto sano documenta sus gemas.', '<h2>Bundler y Gems</h2><p>El ecosistema Ruby gira alrededor de RubyGems y Bundler. Las gemas agregan capacidades nuevas al proyecto; Bundler fija versiones y hace reproducible el entorno.</p><pre><code>gemas = ["rspec", "rubocop"]; puts gemas.join(", ")</code></pre>', 10, 22, 65, 'join', 'El metodo <code>join</code> convierte una lista en una cadena separando sus elementos con el texto indicado.', 'Completa el metodo para mostrar una lista simple de gemas separadas por comas.', 'gemas = ["rspec", "rubocop"]; puts gemas._____(", ")', 'Bundler, gems, and project organization', 'Understand how Ruby manages dependencies and why healthy projects document their gems clearly.', '<h2>Bundler and gems</h2><p>The Ruby ecosystem revolves around RubyGems and Bundler. Gems add new capabilities to a project; Bundler pins versions and makes environments reproducible.</p><pre><code>gems = ["rspec", "rubocop"]; puts gems.join(", ")</code></pre>', 'The <code>join</code> method converts a list into a string separated by the given text.', 'Complete the method to display a simple comma-separated gems list.'),
('ruby-advanced', 'Fiber Scheduler y tareas cooperativas', 'ruby-fiber-scheduler', 'Explora el modelo cooperativo moderno de Ruby para operaciones de E/S sin bloquear todo el proceso.', '<h2>Fiber Scheduler</h2><p>Ademas de threads y Ractors, Ruby moderno puede coordinar tareas cooperativas con Fibers y un scheduler orientado a operaciones de E/S.</p><pre><code>fiber = Fiber.new { Fiber.yield("pausa") }; puts fiber.resume</code></pre>', 6, 28, 80, 'yield', 'La llamada <code>Fiber.yield</code> cede el control temporalmente y devuelve un valor al reanudar.', 'Completa la instruccion que pausa la Fiber y devuelve el mensaje inicial.', 'fiber = Fiber.new { Fiber._____("pausa") }; puts fiber.resume', 'Fiber Scheduler and cooperative tasks', 'Explore Ruby''s modern cooperative model for I/O-heavy work without blocking the whole process.', '<h2>Fiber Scheduler</h2><p>Alongside threads and Ractors, modern Ruby can coordinate cooperative tasks with Fibers and a scheduler centered on I/O operations.</p><pre><code>fiber = Fiber.new { Fiber.yield("pause") }; puts fiber.resume</code></pre>', 'The <code>Fiber.yield</code> call temporarily transfers control and returns a value when resumed.', 'Complete the instruction that pauses the Fiber and returns the initial message.'),
('ruby-advanced', 'HTTP, JSON y servicios modernos', 'ruby-http-json-servicios', 'Prepara Ruby para integrarse con APIs, procesar respuestas y mover datos entre servicios.', '<h2>HTTP, JSON y servicios</h2><p>Ruby tambien participa en integraciones, clientes HTTP y microservicios. Un flujo comun es recibir JSON, parsearlo y reaccionar segun el contenido.</p><pre><code>require "json"; datos = JSON.parse("{\"ok\":true}"); puts datos["ok"]</code></pre>', 7, 28, 80, 'parse', 'Usa <code>JSON.parse</code> para convertir una cadena JSON en una estructura Ruby navegable.', 'Completa la llamada que transforma la respuesta JSON en un hash Ruby.', 'require "json"; respuesta = "{\"ok\":true}"; datos = JSON._____(respuesta); puts datos["ok"]', 'HTTP, JSON, and modern services', 'Prepare Ruby to integrate with APIs, process responses, and move data between services.', '<h2>HTTP, JSON, and services</h2><p>Ruby also fits integrations, HTTP clients, and microservices. A common flow is to receive JSON, parse it, and react based on its contents.</p><pre><code>require "json"; data = JSON.parse("{\"ok\":true}"); puts data["ok"]</code></pre>', 'Use <code>JSON.parse</code> to convert a JSON string into a navigable Ruby structure.', 'Complete the call that transforms the JSON response into a Ruby hash.'),
('ruby-advanced', 'Pruebas automatizadas con RSpec', 'ruby-pruebas-rspec', 'Aprende a verificar comportamiento, aislar regresiones y documentar intencion con ejemplos ejecutables.', '<h2>Pruebas automatizadas con RSpec</h2><p>Las pruebas bien escritas no solo detectan fallos: tambien aclaran contratos y facilitan refactors seguros.</p><pre><code>expect(2 + 2).to eq(4)</code></pre>', 8, 28, 75, 'to', 'RSpec usa la forma <code>expect(valor).to eq(esperado)</code> para expresar una expectativa afirmativa.', 'Completa la asercion para validar que el resultado esperado es 4.', 'expect(2 + 2)._____ eq(4)', 'Testing with RSpec', 'Learn to verify behavior, isolate regressions, and document intent with executable examples.', '<h2>Testing with RSpec</h2><p>Well-written tests do more than catch failures: they clarify contracts and enable safer refactors.</p><pre><code>expect(2 + 2).to eq(4)</code></pre>', 'RSpec uses the form <code>expect(value).to eq(expected)</code> to express a positive expectation.', 'Complete the assertion to validate that the expected result is 4.'),
('ruby-advanced', 'Proyecto integrador: auditor de logs', 'ruby-proyecto-final', 'Integra colecciones, parsing, manejo de errores y salida estructurada en una herramienta utilizable.', '<h2>Proyecto integrador: auditor de logs</h2><p>El cierre de la ruta avanzada propone un caso cercano a produccion: leer eventos, filtrar errores, agruparlos y preparar una salida clara.</p><pre><code>logs = [{ tipo: "INFO" }, { tipo: "ERROR" }]; errores = logs.select { |log| log[:tipo] == "ERROR" }</code></pre>', 9, 35, 90, 'select', 'El metodo <code>select</code> conserva los elementos para los que el bloque devuelve verdadero.', 'Completa el filtro para conservar solo los logs de tipo ERROR.', 'logs = [{ tipo: "INFO" }, { tipo: "ERROR" }]; errores = logs._____ { |log| log[:tipo] == "ERROR" }', 'Capstone project: log auditor', 'Combine collections, parsing, error handling, and structured output in a usable tool.', '<h2>Capstone project: log auditor</h2><p>The advanced path closes with a production-like case: read events, filter errors, group them, and prepare a clear output.</p><pre><code>logs = [{ type: "INFO" }, { type: "ERROR" }]; errors = logs.select { |log| log[:type] == "ERROR" }</code></pre>', 'The <code>select</code> method keeps the elements for which the block returns true.', 'Complete the filter to keep only logs of type ERROR.');

INSERT INTO lessons (learning_path_id, title, slug, description, content, order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward)
SELECT lp.id, seed.title, seed.slug, seed.description, seed.content, seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM ruby_refresh seed
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

INSERT INTO lesson_translations (lesson_id, locale, title, description, content)
SELECT l.id, 'en', seed.title_en, seed.description_en, seed.content_en
FROM ruby_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), content = VALUES(content);

INSERT INTO lesson_solutions (lesson_id, language_id, solution_code, explanation, prompt, base_code)
SELECT l.id, pl.id, seed.solution_code, seed.explanation, seed.prompt, seed.base_code
FROM ruby_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE language_id = VALUES(language_id), solution_code = VALUES(solution_code), explanation = VALUES(explanation), prompt = VALUES(prompt), base_code = VALUES(base_code);

INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM ruby_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
JOIN lesson_solutions ls ON ls.lesson_id = l.id
ON DUPLICATE KEY UPDATE explanation = VALUES(explanation), prompt = VALUES(prompt);

DELETE ltc FROM lesson_test_cases ltc JOIN lessons l ON l.id = ltc.lesson_id JOIN ruby_refresh seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica el concepto tecnico descrito en la leccion.', 0, 10, 1
FROM ruby_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe conservar sintaxis valida y una salida coherente.', 1, 10, 2
FROM ruby_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE ruby_refresh;

CREATE TEMPORARY TABLE go_refresh (
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
  base_code TEXT NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  content_en LONGTEXT NOT NULL,
  explanation_en TEXT NOT NULL,
  prompt_en TEXT NOT NULL
);

INSERT INTO go_refresh (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code, title_en, description_en, content_en, explanation_en, prompt_en
) VALUES
('go-primer', 'Como piensa Go: package, main y fmt', 'go-primer-como-piensa', 'Conceptos base para entender la estructura minima de un programa Go y su salida por consola.', '<h2>Como piensa Go</h2><p>Go organiza un programa pequeno alrededor de un paquete, una funcion principal y paquetes de la libreria estandar. Al inicio importa dominar el esqueleto del archivo, compilar sin errores y observar la salida.</p><pre><code>package main; import "fmt"; func main() { fmt.Println("Hola, CodeQuest") }</code></pre>', 1, 15, 25, 'fmt', 'El paquete <code>fmt</code> aporta funciones de impresion como <code>Println</code>.', 'Completa el nombre del paquete importado para imprimir texto en consola.', 'package main; import "_____"; func main() { fmt.Println("Hola") }', 'How Go thinks: package, main, and fmt', 'Core ideas to understand the minimal structure of a Go program and its console output.', '<h2>How Go thinks</h2><p>Go organizes a small program around a package, a main function, and standard library packages. At the start, the important things are to understand the file skeleton, compile without errors, and inspect the output.</p><pre><code>package main; import "fmt"; func main() { fmt.Println("Hello, CodeQuest") }</code></pre>', 'The <code>fmt</code> package provides printing functions such as <code>Println</code>.', 'Complete the imported package name to print text to the console.'),
('go-primer', 'Variables, tipos y compilacion estricta', 'go-primer-variables-tipos', 'Introduce el tipado estatico, la inferencia y la importancia del compilador como guia.', '<h2>Variables, tipos y compilacion estricta</h2><p>Go es estricto de forma deliberada: detecta errores temprano y obliga a que el codigo sea claro.</p><pre><code>edad := 18; fmt.Println(edad)</code></pre>', 2, 15, 25, 'edad', 'La variable <code>edad</code> es la que almacena el entero que luego imprimimos.', 'Completa el identificador que debe mostrarse en consola.', 'package main; import "fmt"; func main() { edad := 18; fmt.Println(_____) }', 'Variables, types, and strict compilation', 'Introduce static typing, inference, and why the compiler is part of the learning loop.', '<h2>Variables, types, and strict compilation</h2><p>Go is intentionally strict: it catches errors early and expects code to stay clear.</p><pre><code>age := 18; fmt.Println(age)</code></pre>', 'The variable <code>edad</code> stores the integer that must be printed later.', 'Complete the identifier that should be displayed in the console.'),
('go-primer', 'Funciones, main y retorno', 'go-primer-funciones-main', 'Entiende como encapsular una accion y devolver un valor desde una funcion simple.', '<h2>Funciones y retorno</h2><p>Go separa con claridad donde empieza el programa y donde vive la logica reutilizable. La funcion <code>main</code> inicia la ejecucion, mientras otras funciones encapsulan trabajo reutilizable.</p><pre><code>func saludar() string { return "Hola" }</code></pre>', 3, 15, 25, 'saludar', 'Se debe invocar la funcion <code>saludar</code> para obtener el texto retornado.', 'Completa la llamada a la funcion que devuelve el saludo.', 'package main; import "fmt"; func saludar() string { return "Hola" }; func main() { fmt.Println(_____()) }', 'Functions, main, and return values', 'Understand how to wrap behavior in a function and return a value from a simple flow.', '<h2>Functions and return values</h2><p>Go cleanly separates where a program starts from where reusable logic lives.</p><pre><code>func greet() string { return "Hello" }</code></pre>', 'You must call the <code>saludar</code> function to obtain the returned text.', 'Complete the function call that returns the greeting.'),
('go-primer', 'Arrays, slices e indices', 'go-primer-colecciones', 'Diferencia entre una coleccion fija y una vista dinamica, y repasa el indice cero.', '<h2>Arrays, slices e indices</h2><p>Go distingue entre arrays de tamano fijo y slices mas flexibles. Ambas estructuras usan indices que empiezan en <code>0</code>.</p><pre><code>temas := []string{"variables", "funciones"}; fmt.Println(temas[0])</code></pre>', 4, 15, 25, '0', 'El primer elemento de una coleccion se obtiene con el indice <code>0</code>.', 'Completa el indice para imprimir el primer tema.', 'package main; import "fmt"; func main() { temas := []string{"variables", "funciones"}; fmt.Println(temas[_____]) }', 'Arrays, slices, and indexes', 'Differentiate fixed-size collections from dynamic views and review zero-based indexing.', '<h2>Arrays, slices, and indexes</h2><p>Go distinguishes between fixed-size arrays and more flexible slices. Both structures use indexes that start at <code>0</code>.</p><pre><code>topics := []string{"variables", "functions"}; fmt.Println(topics[0])</code></pre>', 'The first element of a collection is retrieved with index <code>0</code>.', 'Complete the index to print the first topic.'),
('go-primer', 'Errores del compilador y gofmt', 'go-primer-errores-gofmt', 'Adopta desde el principio la lectura de errores y el formateo automatico del codigo.', '<h2>Errores del compilador y gofmt</h2><p>El compilador marca rapidamente variables no usadas, imports sobrantes o tipos incompatibles, y <code>gofmt</code> impone un estilo unico para el codigo.</p><pre><code>mensaje := "ordenado"; fmt.Println(mensaje)</code></pre>', 5, 15, 25, 'mensaje', 'La variable <code>mensaje</code> debe usarse para evitar codigo inutil y mostrar el valor correcto.', 'Completa el identificador que debe imprimirse.', 'package main; import "fmt"; func main() { mensaje := "ordenado"; fmt.Println(_____) }', 'Compiler errors and gofmt', 'Adopt error reading and automatic formatting from the beginning.', '<h2>Compiler errors and gofmt</h2><p>The compiler quickly points out unused variables, extra imports, or incompatible types, and <code>gofmt</code> enforces a single style for code.</p><pre><code>message := "formatted"; fmt.Println(message)</code></pre>', 'The variable <code>mensaje</code> must be used to avoid dead code and display the correct value.', 'Complete the identifier that should be printed.'),
('go-intermediate', 'Paquetes, modulos y workspaces', 'go-paquetes-modulos-workspaces', 'Organiza codigo por paquetes, administra dependencias con go.mod y comprende cuando usar workspaces.', '<h2>Paquetes, modulos y workspaces</h2><p>En Go, un paquete organiza archivos relacionados y un modulo define una unidad versionable con su archivo <code>go.mod</code>. Cuando un proyecto crece y necesitas coordinar varios modulos, los workspaces ayudan a trabajar en conjunto.</p><pre><code>module codequest/go</code></pre>', 8, 24, 65, 'Println', 'La funcion <code>Println</code> del paquete <code>fmt</code> mantiene el ejemplo minimo ejecutable dentro del modulo.', 'Completa la llamada del paquete fmt en el ejemplo basico del modulo.', 'package main; import "fmt"; func main() { fmt._____("modulo listo") }', 'Packages, modules, and workspaces', 'Organize code with packages, manage dependencies with go.mod, and understand when workspaces help.', '<h2>Packages, modules, and workspaces</h2><p>In Go, a package organizes related files and a module defines a versioned unit through its <code>go.mod</code> file. When a project grows and you need to coordinate multiple modules, workspaces help you work across them.</p><pre><code>module codequest/go</code></pre>', 'The <code>Println</code> function from the <code>fmt</code> package keeps the module example minimal and runnable.', 'Complete the fmt package call in the basic module example.'),
('go-advanced', 'Testing, subtests y benchmarks', 'go-testing-benchmarks', 'Aprende a validar comportamiento, organizar escenarios y medir rendimiento sin salir de la herramienta oficial.', '<h2>Testing en Go</h2><p>Go integra pruebas en su flujo normal de trabajo mediante el paquete <code>testing</code>. Puedes crear pruebas unitarias, agrupar escenarios con subtests y medir rendimiento con benchmarks.</p><pre><code>func TestLogin(t *testing.T) { t.Run("valido", func(t *testing.T) {}) }</code></pre>', 7, 28, 80, 'Run', 'El metodo <code>t.Run</code> crea un subtest con nombre propio dentro de la prueba principal.', 'Completa la llamada que crea el subtest llamado "valido".', 'package ejemplo; import "testing"; func TestLogin(t *testing.T) { t._____("valido", func(t *testing.T) {}) }', 'Testing, subtests, and benchmarks', 'Learn to validate behavior, organize scenarios, and measure performance with Go''s official tooling.', '<h2>Testing in Go</h2><p>Go integrates testing into the everyday workflow through the <code>testing</code> package. You can write unit tests, group scenarios with subtests, and measure performance with benchmarks.</p><pre><code>func TestLogin(t *testing.T) { t.Run("valid", func(t *testing.T) {}) }</code></pre>', 'The <code>t.Run</code> method creates a named subtest within the main test.', 'Complete the call that creates the subtest named "valido".'),
('go-advanced', 'Fuzzing y revision de vulnerabilidades', 'go-fuzzing-vulncheck', 'Amplia la cobertura de pruebas con entradas generadas automaticamente y revisa dependencias riesgosas.', '<h2>Fuzzing y seguridad en Go</h2><p>Las versiones modernas de Go incorporan fuzzing para descubrir casos limite y herramientas como <code>govulncheck</code> para revisar dependencias vulnerables.</p><pre><code>func FuzzEcho(f *testing.F) { f.Add("hola") }</code></pre>', 8, 28, 80, 'Add', 'La llamada <code>f.Add</code> registra un caso semilla inicial para el fuzz test.', 'Completa la llamada que agrega la entrada semilla al fuzz test.', 'package ejemplo; import "testing"; func FuzzEcho(f *testing.F) { f._____("hola") }', 'Fuzzing and vulnerability review', 'Broaden test coverage with generated inputs and review risky dependencies.', '<h2>Fuzzing and security in Go</h2><p>Modern Go versions include fuzzing to discover edge cases and tools such as <code>govulncheck</code> to review vulnerable dependencies.</p><pre><code>func FuzzEcho(f *testing.F) { f.Add("hello") }</code></pre>', 'The <code>f.Add</code> call registers an initial seed input for the fuzz test.', 'Complete the call that adds the seed input to the fuzz test.'),
('go-advanced', 'Acceso a bases de datos con database/sql', 'go-database-sql', 'Conecta servicios Go con almacenamiento relacional siguiendo una API estandar del lenguaje.', '<h2>database/sql</h2><p>Muchos servicios Go terminan consultando una base de datos. El paquete <code>database/sql</code> define una interfaz comun para abrir conexiones, ejecutar consultas y controlar errores.</p><pre><code>var db *sql.DB; _ = db.Ping()</code></pre>', 9, 28, 80, 'Ping', 'El metodo <code>Ping</code> permite verificar que la conexion de base de datos responda correctamente.', 'Completa la llamada que valida el estado de la conexion.', 'package main; import "database/sql"; func main() { var db *sql.DB; _ = db._____() }', 'Database access with database/sql', 'Connect Go services to relational storage through the standard language API.', '<h2>database/sql</h2><p>Many Go services eventually query a database. The <code>database/sql</code> package defines a common interface for opening connections, executing queries, and handling errors.</p><pre><code>var db *sql.DB; _ = db.Ping()</code></pre>', 'The <code>Ping</code> method verifies that the database connection is responding correctly.', 'Complete the call that validates the connection state.'),
('go-advanced', 'Proyecto final: API HTTP concurrente', 'go-proyecto-final', 'Integra rutas, concurrencia del runtime y respuesta estructurada en un servicio pequeno pero realista.', '<h2>Proyecto final: API HTTP concurrente</h2><p>El cierre de la ruta avanzada propone construir una API minima con <code>net/http</code>. Cada solicitud se atiende de forma concurrente, por lo que conviene escribir handlers pequenos y claros.</p><pre><code>http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { fmt.Fprintf(w, "OK") }); http.ListenAndServe(":8080", nil)</code></pre>', 10, 35, 90, 'nil', 'Se pasa <code>nil</code> para utilizar el multiplexor HTTP por defecto del paquete <code>net/http</code>.', 'Completa el segundo argumento para iniciar el servidor usando el multiplexor por defecto.', 'package main; import "fmt"; import "net/http"; func main() { http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { fmt.Fprintf(w, "OK") }); http.ListenAndServe(":8080", _____) }', 'Capstone project: concurrent HTTP API', 'Integrate routing, runtime concurrency, and structured responses in a small but realistic service.', '<h2>Capstone project: concurrent HTTP API</h2><p>The advanced path closes by building a minimal API with <code>net/http</code>. Each request is handled concurrently, so handlers should remain small and clear.</p><pre><code>http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { fmt.Fprintf(w, "OK") }); http.ListenAndServe(":8080", nil)</code></pre>', 'Pass <code>nil</code> to use the default HTTP multiplexer from the <code>net/http</code> package.', 'Complete the second argument to start the server using the default multiplexer.');

INSERT INTO lessons (learning_path_id, title, slug, description, content, order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward)
SELECT lp.id, seed.title, seed.slug, seed.description, seed.content, seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM go_refresh seed
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

INSERT INTO lesson_translations (lesson_id, locale, title, description, content)
SELECT l.id, 'en', seed.title_en, seed.description_en, seed.content_en
FROM go_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), content = VALUES(content);

INSERT INTO lesson_solutions (lesson_id, language_id, solution_code, explanation, prompt, base_code)
SELECT l.id, pl.id, seed.solution_code, seed.explanation, seed.prompt, seed.base_code
FROM go_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE language_id = VALUES(language_id), solution_code = VALUES(solution_code), explanation = VALUES(explanation), prompt = VALUES(prompt), base_code = VALUES(base_code);

INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM go_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
JOIN lesson_solutions ls ON ls.lesson_id = l.id
ON DUPLICATE KEY UPDATE explanation = VALUES(explanation), prompt = VALUES(prompt);

DELETE ltc FROM lesson_test_cases ltc JOIN lessons l ON l.id = ltc.lesson_id JOIN go_refresh seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica el concepto tecnico descrito en la leccion.', 0, 10, 1
FROM go_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe conservar sintaxis valida y una salida coherente.', 1, 10, 2
FROM go_refresh seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE go_refresh;

COMMIT;