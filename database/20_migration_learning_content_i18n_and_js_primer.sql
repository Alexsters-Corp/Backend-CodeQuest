-- Learning content i18n and optional JavaScript primer module.

ALTER TABLE learning_paths
  ADD COLUMN IF NOT EXISTS is_optional TINYINT(1) NOT NULL DEFAULT 0 AFTER estimated_hours,
  ADD COLUMN IF NOT EXISTS order_position INT UNSIGNED NOT NULL DEFAULT 999 AFTER is_optional;

CREATE INDEX IF NOT EXISTS idx_learning_paths_is_optional ON learning_paths (is_optional);
CREATE INDEX IF NOT EXISTS idx_learning_paths_order_position ON learning_paths (order_position);

CREATE TABLE IF NOT EXISTS learning_path_translations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  learning_path_id INT UNSIGNED NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_path_translations_path
    FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
  UNIQUE KEY unique_path_locale (learning_path_id, locale),
  INDEX idx_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_translations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT UNSIGNED NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  content LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lesson_translations_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_lesson_locale (lesson_id, locale),
  INDEX idx_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_solution_translations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_solution_id INT UNSIGNED NOT NULL,
  locale VARCHAR(10) NOT NULL,
  explanation TEXT NULL,
  prompt TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lesson_solution_translations_solution
    FOREIGN KEY (lesson_solution_id) REFERENCES lesson_solutions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_solution_locale (lesson_solution_id, locale),
  INDEX idx_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO learning_paths (
  programming_language_id, name, slug, description, difficulty_level,
  estimated_hours, is_optional, order_position, is_active
)
SELECT id, 'JavaScript Primer: Glosario tecnico', 'javascript-primer',
       'Modulo opcional para estudiantes sin experiencia previa: vocabulario, sintaxis y conceptos base antes de iniciar JavaScript Esencial.',
       'principiante', 8, 1, 1, 1
FROM programming_languages
WHERE slug = 'javascript'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  difficulty_level = VALUES(difficulty_level),
  estimated_hours = VALUES(estimated_hours),
  is_optional = VALUES(is_optional),
  order_position = VALUES(order_position),
  is_active = VALUES(is_active);

UPDATE learning_paths SET is_optional = 0, order_position = 2 WHERE slug = 'javascript-essentials';
UPDATE learning_paths SET is_optional = 0, order_position = 3 WHERE slug = 'javascript-intermediate';
UPDATE learning_paths SET is_optional = 0, order_position = 4 WHERE slug = 'javascript-advanced';

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'es', name, description FROM learning_paths
WHERE slug IN ('javascript-primer','javascript-essentials','javascript-intermediate','javascript-advanced')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'en',
  CASE slug
    WHEN 'javascript-primer' THEN 'JavaScript Primer: Technical Glossary'
    WHEN 'javascript-essentials' THEN 'JavaScript Essentials'
    WHEN 'javascript-intermediate' THEN 'Intermediate JavaScript'
    WHEN 'javascript-advanced' THEN 'Advanced JavaScript'
  END,
  CASE slug
    WHEN 'javascript-primer' THEN 'Optional module for students with no programming background: vocabulary, syntax, and base concepts before JavaScript Essentials.'
    WHEN 'javascript-essentials' THEN 'Initial path for syntax, control flow, functions, arrays, objects, and basic DOM in modern JavaScript.'
    WHEN 'javascript-intermediate' THEN 'Go deeper into modules, collections, async code, errors, and object-oriented JavaScript.'
    WHEN 'javascript-advanced' THEN 'Advanced path for deep async flows, concurrency, metaprogramming, performance, and modern language APIs.'
  END
FROM learning_paths
WHERE slug IN ('javascript-primer','javascript-essentials','javascript-intermediate','javascript-advanced')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

CREATE TEMPORARY TABLE js_primer_seed (
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  order_position INT UNSIGNED NOT NULL,
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

INSERT INTO js_primer_seed VALUES
('Que es programar y como piensa JavaScript', 'js-primer-programar',
'Conceptos iniciales: programa, instruccion, valor, consola y flujo de ejecucion.',
'<h2>Que es programar y como piensa JavaScript</h2><p>Programar es escribir instrucciones para que una maquina transforme datos y produzca un resultado. En JavaScript esas instrucciones se ejecutan de arriba hacia abajo, salvo cuando una funcion, evento o tarea asincrona cambia el flujo.</p><h3>Palabras base</h3><p>Un <strong>programa</strong> es una secuencia de instrucciones. Una <strong>expresion</strong> produce un valor. Una <strong>sentencia</strong> realiza una accion.</p><pre><code>const mensaje = "Hola CodeQuest"\nconsole.log(mensaje)</code></pre><p>La consola es el primer lugar donde observas si una instruccion hizo lo esperado.</p>',
1, 'mensaje',
'La variable mensaje contiene el valor que queremos observar en consola.',
'Completa el identificador faltante para imprimir el mensaje guardado.',
'const mensaje = "Hola CodeQuest"\nconsole.log(_____);',
'What programming is and how JavaScript thinks',
'Initial concepts: program, instruction, value, console, and execution flow.',
'<h2>What programming is and how JavaScript thinks</h2><p>Programming means writing instructions so a machine can transform data and produce a result. In JavaScript, instructions usually run from top to bottom unless a function, event, or async task changes the flow.</p><h3>Base vocabulary</h3><p>A <strong>program</strong> is a sequence of instructions. An <strong>expression</strong> produces a value. A <strong>statement</strong> performs an action.</p><pre><code>const message = "Hello CodeQuest"\nconsole.log(message)</code></pre><p>The console is the first place where you check whether an instruction did what you expected.</p>',
'The variable message stores the value we want to observe in the console.',
'Complete the missing identifier to print the stored message.'),

('Identificadores, variables y constantes', 'js-primer-identificadores',
'Diferencia entre nombre tecnico, variable, constante y valor.',
'<h2>Identificadores, variables y constantes</h2><p>Un <strong>identificador</strong> es el nombre que le das a algo en el codigo: una variable, una funcion, una clase o un parametro.</p><h3>Variables</h3><p>Una variable guarda una referencia a un valor. Usa nombres claros para que el codigo explique su intencion.</p><pre><code>const edadMinima = 18\nlet intentos = 0</code></pre><p><code>const</code> evita reasignar la referencia; <code>let</code> permite cambiarla cuando el flujo lo necesita.</p>',
2, 'edadMinima',
'edadMinima es el identificador que guarda el numero usado por la regla.',
'Completa el identificador faltante para imprimir la edad minima.',
'const edadMinima = 18\nconsole.log(_____);',
'Identifiers, variables, and constants',
'Difference between a technical name, a variable, a constant, and a value.',
'<h2>Identifiers, variables, and constants</h2><p>An <strong>identifier</strong> is the name you give to something in code: a variable, a function, a class, or a parameter.</p><h3>Variables</h3><p>A variable stores a reference to a value. Use clear names so the code explains its purpose.</p><pre><code>const minimumAge = 18\nlet attempts = 0</code></pre><p><code>const</code> prevents reassigning the reference; <code>let</code> allows changes when the flow needs them.</p>',
'minimumAge is the identifier that stores the number used by the rule.',
'Complete the missing identifier to print the minimum age.'),

('Tipos de datos: texto, numeros y booleanos', 'js-primer-tipos-datos',
'Vocabulario basico para entender strings, numbers, booleans, null y undefined.',
'<h2>Tipos de datos</h2><p>Un tipo de dato describe la clase de valor con la que trabaja el programa. JavaScript tiene strings para texto, numbers para numeros y booleans para verdadero o falso.</p><pre><code>const nombre = "Ada"\nconst puntos = 100\nconst activo = true</code></pre><h3>Ausencia de valor</h3><p><code>null</code> representa una ausencia intencional. <code>undefined</code> aparece cuando algo todavia no tiene valor asignado.</p>',
3, 'activo',
'activo es el booleano que indica si algo esta habilitado.',
'Completa el identificador faltante para imprimir el estado booleano.',
'const activo = true\nconsole.log(_____);',
'Data types: text, numbers, and booleans',
'Base vocabulary for strings, numbers, booleans, null, and undefined.',
'<h2>Data types</h2><p>A data type describes the kind of value a program is working with. JavaScript uses strings for text, numbers for numeric values, and booleans for true or false.</p><pre><code>const name = "Ada"\nconst points = 100\nconst active = true</code></pre><h3>Missing values</h3><p><code>null</code> represents an intentional empty value. <code>undefined</code> appears when something has no assigned value yet.</p>',
'active is the boolean that indicates whether something is enabled.',
'Complete the missing identifier to print the boolean state.'),

('Arrays, indices y colecciones', 'js-primer-arrays',
'Que es un array, como leer posiciones y por que los indices empiezan en cero.',
'<h2>Arrays, indices y colecciones</h2><p>Un <strong>array</strong> es una lista ordenada de valores. Cada posicion tiene un indice y en JavaScript el primer indice es <code>0</code>.</p><pre><code>const lenguajes = ["JavaScript", "Python", "Java"]\nconst primero = lenguajes[0]</code></pre><p>Los arrays se usan para preguntas, resultados, usuarios, productos y cualquier conjunto ordenado.</p>',
4, 'primero',
'primero guarda el elemento ubicado en el indice 0 del array.',
'Completa el identificador faltante para imprimir el primer lenguaje.',
'const lenguajes = ["JavaScript", "Python", "Java"]\nconst primero = lenguajes[0]\nconsole.log(_____);',
'Arrays, indexes, and collections',
'What an array is, how positions are read, and why indexes start at zero.',
'<h2>Arrays, indexes, and collections</h2><p>An <strong>array</strong> is an ordered list of values. Each position has an index, and in JavaScript the first index is <code>0</code>.</p><pre><code>const languages = ["JavaScript", "Python", "Java"]\nconst first = languages[0]</code></pre><p>Arrays are used for questions, results, users, products, and any ordered set.</p>',
'first stores the element located at index 0 of the array.',
'Complete the missing identifier to print the first language.'),

('Sintaxis, bloques y errores comunes', 'js-primer-sintaxis',
'Llaves, parentesis, comillas, comentarios y lectura de errores basicos.',
'<h2>Sintaxis, bloques y errores comunes</h2><p>La sintaxis es la forma correcta de escribir instrucciones. Parentesis, llaves, comillas y corchetes deben abrirse y cerrarse correctamente.</p><pre><code>if (puntos >= 50) {\n  console.log("Aprobado")\n}</code></pre><h3>Comentarios</h3><p>Los comentarios explican decisiones, no repiten lo obvio. Usa <code>//</code> para una linea y <code>/* */</code> para bloques.</p><p>Cuando el codigo falla, lee el mensaje de error y ubica la linea mencionada antes de cambiar muchas cosas.</p>',
5, 'estado',
'estado guarda la palabra calculada por la condicion.',
'Completa el identificador faltante para imprimir el estado calculado.',
'const puntos = 70\nconst estado = puntos >= 50 ? "Aprobado" : "Revisar"\nconsole.log(_____);',
'Syntax, blocks, and common errors',
'Braces, parentheses, quotes, comments, and reading basic errors.',
'<h2>Syntax, blocks, and common errors</h2><p>Syntax is the correct way to write instructions. Parentheses, braces, quotes, and brackets must be opened and closed correctly.</p><pre><code>if (points >= 50) {\n  console.log("Passed")\n}</code></pre><h3>Comments</h3><p>Comments explain decisions; they do not repeat the obvious. Use <code>//</code> for one line and <code>/* */</code> for blocks.</p><p>When code fails, read the error message and locate the mentioned line before changing too many things.</p>',
'state stores the word calculated by the condition.',
'Complete the missing identifier to print the calculated state.');

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward
)
SELECT lp.id, seed.title, seed.slug, seed.description, seed.content,
       seed.order_position, 15, 1, 0, 0, 25
FROM js_primer_seed seed
JOIN learning_paths lp ON lp.slug = 'javascript-primer'
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  content = VALUES(content),
  order_position = VALUES(order_position),
  estimated_minutes = VALUES(estimated_minutes),
  is_published = VALUES(is_published),
  xp_reward = VALUES(xp_reward);

INSERT INTO lesson_translations (lesson_id, locale, title, description, content)
SELECT l.id, 'en', seed.title_en, seed.description_en, seed.content_en
FROM js_primer_seed seed
JOIN learning_paths lp ON lp.slug = 'javascript-primer'
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  content = VALUES(content);

INSERT INTO lesson_solutions (lesson_id, language_id, solution_code, explanation, prompt, base_code)
SELECT l.id, pl.id, seed.solution_code, seed.explanation, seed.prompt, seed.base_code
FROM js_primer_seed seed
JOIN learning_paths lp ON lp.slug = 'javascript-primer'
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE
  solution_code = VALUES(solution_code),
  explanation = VALUES(explanation),
  prompt = VALUES(prompt),
  base_code = VALUES(base_code);

INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM js_primer_seed seed
JOIN learning_paths lp ON lp.slug = 'javascript-primer'
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
JOIN lesson_solutions ls ON ls.lesson_id = l.id
ON DUPLICATE KEY UPDATE
  explanation = VALUES(explanation),
  prompt = VALUES(prompt);

DELETE ltc
FROM lesson_test_cases ltc
JOIN lessons l ON l.id = ltc.lesson_id
JOIN learning_paths lp ON lp.id = l.learning_path_id
WHERE lp.slug = 'javascript-primer';

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Comprueba el concepto tecnico explicado.', 0, 10, 1
FROM lessons l
JOIN learning_paths lp ON lp.id = l.learning_path_id
WHERE lp.slug = 'javascript-primer';

CREATE TEMPORARY TABLE js_translation_seed (
  slug VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  content_en LONGTEXT NOT NULL,
  explanation_en TEXT NOT NULL,
  prompt_en TEXT NOT NULL
);

INSERT INTO js_translation_seed VALUES
('js-fundamentos','JavaScript Fundamentals','Variables, data types, operators, and console output in modern JavaScript.','<h2>JavaScript Fundamentals</h2><p>JavaScript creates browser interactions and server behavior with Node.js. In CodeQuest we begin with small programs: declare data, transform it, and observe the result.</p><h3>Variables with const and let</h3><p>Use <code>const</code> when a reference should not be reassigned and <code>let</code> when the value changes during the flow.</p><pre><code>const name = "CodeQuest"\nlet attempts = 0\nattempts += 1\nconsole.log(name, attempts)</code></pre><h3>Basic types</h3><p>Common types include string, number, boolean, null, undefined, object, and symbol. Recognizing them helps you avoid comparison and transformation errors.</p>','The variable <code>name</code> contains the text that must be shown.','Complete the missing identifier to print the platform name.'),
('js-salida-operadores','Output, operators, and conversions','Using console.log, arithmetic operators, comparisons, and explicit conversions.','<h2>Output, operators, and conversions</h2><p>A clear way to learn JavaScript is to execute an expression, print the result, and check whether it matches what you expected.</p><h3>Operators</h3><p>Arithmetic operators calculate values; comparison operators produce booleans.</p><pre><code>const subtotal = 80\nconst tax = 20\nconst total = subtotal + tax\nconsole.log(total)</code></pre><h3>Conversions</h3><p>Convert data explicitly when it comes from forms or APIs.</p>','<code>total</code> stores the final sum of subtotal and tax.','Complete the missing identifier to show the calculated total.'),
('js-condicionales-bucles','Conditionals and loops','Control flow with if, else, for, and while to make decisions and repeat tasks.','<h2>Conditionals and loops</h2><p>Control flow lets a program respond to different data. A condition decides which path to take and a loop repeats an action when needed.</p><pre><code>const points = 85\nconst label = points >= 80 ? "passed" : "review"\nconsole.log(label)</code></pre><p>In real projects, loops walk through users, products, answers, or events.</p>','The variable <code>label</code> stores the result of the decision.','Complete the missing identifier to show the calculated state.'),
('js-funciones-scope','Functions and scope','Function declarations, arrow functions, parameters, return values, and variable scope.','<h2>Functions and scope</h2><p>A function wraps an action that can be reused. Parameters receive data and <code>return</code> sends back a result.</p><pre><code>const double = (number) => number * 2\nconst result = double(6)\nconsole.log(result)</code></pre><p>Variables declared inside a function only exist inside that block.</p>','<code>result</code> contains the value returned by the function.','Complete the missing identifier to print the returned value.'),
('js-arrays-basicos','Arrays from zero','Creating arrays, reading by index, push, includes, map, and filter.','<h2>Arrays from zero</h2><p>An array groups ordered values. You can read values by index, add elements, and create new lists from transformations.</p><pre><code>const numbers = [1, 2, 3]\nconst doubles = numbers.map((number) => number * 2)\nconsole.log(doubles)</code></pre><p>In CodeQuest we prefer methods that produce new arrays because they are clear and easy to test.</p>','The variable <code>doubles</code> contains the new array created with <code>map</code>.','Complete the missing identifier to print the transformed array.'),
('js-objetos-json','Objects and JSON','Representing entities with objects, property access, and JSON serialization.','<h2>Objects and JSON</h2><p>Objects represent entities with properties. They are the base of most data that moves between frontend, backend, and APIs.</p><pre><code>const user = { name: "Ada", role: "admin" }\nconsole.log(user.name)</code></pre><p>JSON is a text format for exchanging data between systems.</p>','<code>user.name</code> directly accesses the property that must be printed.','Complete the missing expression to print the user name.'),
('js-dom-eventos','Essential DOM and events','Selecting elements, updating text, and handling browser events.','<h2>Essential DOM and events</h2><p>The DOM is the representation a browser creates for a page. JavaScript can read elements, change content, and react to user events.</p><pre><code>const button = document.querySelector("#save")\nbutton.addEventListener("click", () => console.log("Saved"))</code></pre><p>Events connect buttons, forms, validations, and navigation.</p>','The variable <code>message</code> contains text that could later go to the DOM.','Complete the missing identifier to print the event message.'),
('js-modulos-import-export','Import and export modules','Organizing code with ES modules, named exports, and explicit dependencies.','<h2>Import and export modules</h2><p>Modules split an application into small pieces. Each file declares what it shares and what it needs.</p><pre><code>export const calculateArea = (radius) => Math.PI * radius ** 2\nconst area = calculateArea(5)</code></pre><p>Modules improve maintainability because dependencies are visible.</p>','<code>area</code> stores the result produced by the calculation module.','Complete the missing identifier to show the calculated area.'),
('js-arrays-avanzados','Advanced arrays and reduction','Using reduce, some, every, find, flatMap, and immutable collection copies.','<h2>Advanced arrays and reduction</h2><p>When a list grows, expressive methods help you search, validate, group, or accumulate data.</p><pre><code>const purchases = [20, 30, 50]\nconst total = purchases.reduce((sum, value) => sum + value, 0)</code></pre><p>Choose the method by intent: transform, filter, search, validate, or accumulate.</p>','<code>activeUsers</code> contains only the users that match the condition.','Complete the missing identifier to print the filtered list.'),
('js-sets-maps','Sets, Maps, and iteration','Specialized collections for unique values, key-value pairs, and safe iteration.','<h2>Sets, Maps, and iteration</h2><p><code>Set</code> stores unique values and <code>Map</code> stores key-value pairs without being limited to string keys.</p><pre><code>const tags = ["js", "web", "js"]\nconst unique = new Set(tags)\nconst uniqueTotal = unique.size</code></pre><p>These collections make intent clearer when arrays or objects are not enough.</p>','<code>uniqueTotal</code> stores the Set size.','Complete the missing identifier to print how many unique values exist.'),
('js-async-fetch','Fetch, APIs, and async await','Consuming APIs with fetch, Promises, async await, and JSON responses.','<h2>Fetch, APIs, and async await</h2><p>Modern applications communicate with APIs. <code>fetch</code> returns a Promise and <code>await</code> lets you read the result step by step.</p><pre><code>async function loadProfile() {\n  const response = await fetch("/api/profile")\n  const data = await response.json()\n  return data\n}</code></pre><p>Before using external data, validate HTTP status, structure, and possible errors.</p>','The variable <code>data</code> represents processed JSON from a response.','Complete the missing identifier to print the processed data.'),
('js-errores-debugging','Errors and debugging','try catch, custom errors, traces, and controlled debugging strategies.','<h2>Errors and debugging</h2><p>A well-handled error prevents the whole application from breaking. JavaScript can capture errors and turn technical failures into useful messages.</p><pre><code>try {\n  throw new Error("Invalid data")\n} catch (error) {\n  const message = error.message\n  console.log(message)\n}</code></pre><p>Debugging means forming a hypothesis, observing key data, and confirming the flow.</p>','<code>message</code> stores the readable error text.','Complete the missing identifier to print the captured message.'),
('js-clases-poo','Modern classes and objects','Classes, constructors, methods, private fields, and encapsulation.','<h2>Modern classes and objects</h2><p>Classes provide a clear syntax for building objects with state and behavior.</p><pre><code>class Course {\n  constructor(title) { this.title = title }\n  summary() { return `Course: ${this.title}` }\n}</code></pre><p>Modern JavaScript also supports private fields to hide internal details.</p>','<code>summary</code> stores the text returned by the instance method.','Complete the missing identifier to print the course summary.'),
('js-asincronia','Asynchrony in JavaScript','Event loop, async tasks, Promises, async await, and errors in non-blocking flows.','<h2>Asynchrony in JavaScript</h2><p>JavaScript runs one main task at a time, but the environment can delegate timers, network operations, and events. The event loop coordinates when callbacks and Promises return.</p><pre><code>async function prepare() {\n  const doubles = [1, 2, 3].map((n) => n * 2)\n  return doubles\n}</code></pre><p>Use <code>try/catch</code> with <code>await</code> to handle failures without freezing the interface.</p>','<code>doubles</code> represents the array produced in the async flow.','Complete the missing identifier to show the prepared array.'),
('js-promesas-concurrencia','Promises and controlled concurrency','Promise.all, Promise.allSettled, Promise.race, and concurrent task control.','<h2>Promises and controlled concurrency</h2><p>When async tasks do not depend on each other, you can run them in parallel. The key is choosing the right strategy.</p><pre><code>const names = await Promise.all([\n  Promise.resolve("Ada"),\n  Promise.resolve("Linus")\n])</code></pre><p><code>Promise.allSettled</code> keeps both successful and failed results, useful for dashboards.</p>','<code>names</code> contains the array resolved by <code>Promise.all</code>.','Complete the missing identifier to print the resolved names.'),
('js-metaprogramacion-proxies','Metaprogramming with Proxy and Reflect','Intercepting object operations with Proxy and delegating behavior with Reflect.','<h2>Metaprogramming with Proxy and Reflect</h2><p>A <code>Proxy</code> can intercept reads, writes, and other operations on an object. It is useful for validation, observability, and dynamic APIs.</p><pre><code>const state = new Proxy({ value: 1 }, {\n  set(target, property, value) { target[property] = value; return true }\n})</code></pre><p>Use this technique carefully because it adds power and complexity.</p>','<code>state.value</code> reads the final value stored in the proxied object.','Complete the missing expression to print the updated value.'),
('js-rendimiento-memoria','Performance, memory, and non-blocking code','Practices to avoid blocking, reduce unnecessary work, and measure before optimizing.','<h2>Performance, memory, and non-blocking code</h2><p>JavaScript optimization starts with measurement. Avoid repeating costly calculations, keep structures simple, and split heavy work when it affects the experience.</p><pre><code>const prices = [10, 20, 30]\nconst total = prices.reduce((sum, price) => sum + price, 0)</code></pre><p>In interfaces, avoiding long blocking loops matters as much as fast algorithms.</p>','<code>total</code> stores the sum calculated once.','Complete the missing identifier to print the accumulated total.'),
('js-apis-modernas','Modern language APIs','Optional chaining, nullish coalescing, immutable copies, and modern array methods.','<h2>Modern language APIs</h2><p>JavaScript evolves every year. Current improvements make code safer and more expressive without external libraries.</p><pre><code>const profile = { user: { name: "Ada" } }\nconst result = profile.user?.name ?? "No name"</code></pre><p>Methods such as <code>toSorted</code> and <code>toSpliced</code> return new arrays and avoid mutating the original.</p>','<code>result</code> contains the name or a fallback value.','Complete the missing identifier to print the safe result.'),
('js-temporal-futuro','Temporal and future date handling','Date limitations, Temporal approach, and compatibility decisions.','<h2>Temporal and future date handling</h2><p>The <code>Date</code> API has existed since early JavaScript, but it mixes time zones, parsing, and mutability in ways that are hard to reason about.</p><pre><code>const date = new Date("2026-05-27T00:00:00Z")\nconst isoDate = date.toISOString().slice(0, 10)</code></pre><p><code>Temporal</code> proposes more precise types for dates, times, durations, and zones. Check runtime support before production use.</p>','<code>isoDate</code> stores a stable date representation.','Complete the missing identifier to print the normalized date.'),
('js-proyecto-final','Final project: mini data client','Integrating modules, arrays, async await, errors, and data rendering.','<h2>Final project: mini data client</h2><p>An advanced path should end by integrating concepts. The goal is to read data, transform it, handle errors, and prepare a clear output for the interface.</p><pre><code>async function buildSummary(items) {\n  const active = items.filter((item) => item.active)\n  return active.map((item) => item.name).join(", ")\n}</code></pre><p>This small project connects fundamentals, collections, async work, and presentation.</p>','<code>summary</code> contains the final output ready to display.','Complete the missing identifier to print the built summary.');

INSERT INTO lesson_translations (lesson_id, locale, title, description, content)
SELECT l.id, 'en', seed.title_en, seed.description_en, seed.content_en
FROM js_translation_seed seed
JOIN lessons l ON l.slug = seed.slug
JOIN learning_paths lp ON lp.id = l.learning_path_id
JOIN programming_languages pl ON pl.id = lp.programming_language_id
WHERE pl.slug = 'javascript'
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  content = VALUES(content);

INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM js_translation_seed seed
JOIN lessons l ON l.slug = seed.slug
JOIN learning_paths lp ON lp.id = l.learning_path_id
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lesson_solutions ls ON ls.lesson_id = l.id
WHERE pl.slug = 'javascript'
ON DUPLICATE KEY UPDATE
  explanation = VALUES(explanation),
  prompt = VALUES(prompt);

DROP TEMPORARY TABLE js_primer_seed;
DROP TEMPORARY TABLE js_translation_seed;
