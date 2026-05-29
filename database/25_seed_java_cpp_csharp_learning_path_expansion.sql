-- CodeQuest Java, C++ and C# curriculum expansion.
-- Adapted from standard progressive tutorial methodology and tailored for CodeQuest.
-- No third-party tutorial text is copied.

START TRANSACTION;

INSERT INTO learning_paths (
  programming_language_id, name, slug, description, difficulty_level,
  estimated_hours, is_optional, order_position, is_active
)
SELECT pl.id, 'Java Fundamentos', 'java-fundamentals',
       'Domina sintaxis, tipos, control de flujo, metodos y primeras clases en Java.',
       'principiante', 45, 0, 1, 1
FROM programming_languages pl WHERE pl.slug = 'java'
UNION ALL
SELECT pl.id, 'Java POO y Colecciones', 'java-oop-collections',
       'Construye codigo orientado a objetos con encapsulamiento, herencia, interfaces, colecciones y excepciones.',
       'intermedio', 55, 0, 2, 1
FROM programming_languages pl WHERE pl.slug = 'java'
UNION ALL
SELECT pl.id, 'Java Avanzado y Backend', 'java-advanced-backend',
       'Integra streams, concurrencia, archivos y un proyecto final orientado a servicios backend.',
       'avanzado', 70, 0, 3, 1
FROM programming_languages pl WHERE pl.slug = 'java'
UNION ALL
SELECT pl.id, 'C++ para Principiantes', 'cpp-basics',
       'Aprende sintaxis, tipos, entrada y salida, condicionales, bucles, funciones y arrays en C++.',
       'principiante', 45, 0, 1, 1
FROM programming_languages pl WHERE pl.slug = 'cpp'
UNION ALL
SELECT pl.id, 'C++ POO y STL', 'cpp-oop-stl',
       'Profundiza en clases, referencias, punteros, RAII, contenedores STL y manejo de errores.',
       'intermedio', 60, 0, 2, 1
FROM programming_languages pl WHERE pl.slug = 'cpp'
UNION ALL
SELECT pl.id, 'C++ Avanzado y Sistemas', 'cpp-advanced-systems',
       'Practica templates, lambdas, memoria moderna, archivos, concurrencia y un mini proyecto de rendimiento.',
       'avanzado', 75, 0, 3, 1
FROM programming_languages pl WHERE pl.slug = 'cpp'
UNION ALL
SELECT pl.id, 'C# y .NET', 'csharp-dotnet',
       'Aprende C#, tipos, control de flujo, metodos, colecciones y estructura basica de proyectos .NET.',
       'principiante', 45, 0, 1, 1
FROM programming_languages pl WHERE pl.slug = 'csharp'
UNION ALL
SELECT pl.id, 'C# POO, LINQ y Async', 'csharp-oop-linq',
       'Construye aplicaciones con clases, propiedades, interfaces, LINQ, excepciones y async/await.',
       'intermedio', 60, 0, 2, 1
FROM programming_languages pl WHERE pl.slug = 'csharp'
UNION ALL
SELECT pl.id, 'C# Avanzado y Web APIs', 'csharp-advanced-web',
       'Integra genericos, delegados, archivos JSON, ASP.NET minimal APIs y persistencia con Entity Framework.',
       'avanzado', 75, 0, 3, 1
FROM programming_languages pl WHERE pl.slug = 'csharp'
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
WHERE slug IN (
  'java-fundamentals', 'java-oop-collections', 'java-advanced-backend',
  'cpp-basics', 'cpp-oop-stl', 'cpp-advanced-systems',
  'csharp-dotnet', 'csharp-oop-linq', 'csharp-advanced-web'
)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'en',
  CASE slug
    WHEN 'java-fundamentals' THEN 'Java Fundamentals'
    WHEN 'java-oop-collections' THEN 'Java OOP and Collections'
    WHEN 'java-advanced-backend' THEN 'Advanced Java and Backend'
    WHEN 'cpp-basics' THEN 'C++ for Beginners'
    WHEN 'cpp-oop-stl' THEN 'C++ OOP and STL'
    WHEN 'cpp-advanced-systems' THEN 'Advanced C++ and Systems'
    WHEN 'csharp-dotnet' THEN 'C# and .NET'
    WHEN 'csharp-oop-linq' THEN 'C# OOP, LINQ, and Async'
    WHEN 'csharp-advanced-web' THEN 'Advanced C# and Web APIs'
  END,
  CASE slug
    WHEN 'java-fundamentals' THEN 'Master syntax, types, control flow, methods, and first classes in Java.'
    WHEN 'java-oop-collections' THEN 'Build object-oriented code with encapsulation, inheritance, interfaces, collections, and exceptions.'
    WHEN 'java-advanced-backend' THEN 'Integrate streams, concurrency, files, and a backend-oriented final project.'
    WHEN 'cpp-basics' THEN 'Learn syntax, types, input/output, conditionals, loops, functions, and arrays in C++.'
    WHEN 'cpp-oop-stl' THEN 'Go deeper into classes, references, pointers, RAII, STL containers, and error handling.'
    WHEN 'cpp-advanced-systems' THEN 'Practice templates, lambdas, modern memory, files, concurrency, and a performance mini project.'
    WHEN 'csharp-dotnet' THEN 'Learn C#, types, control flow, methods, collections, and basic .NET project structure.'
    WHEN 'csharp-oop-linq' THEN 'Build applications with classes, properties, interfaces, LINQ, exceptions, and async/await.'
    WHEN 'csharp-advanced-web' THEN 'Integrate generics, delegates, JSON files, ASP.NET minimal APIs, and Entity Framework persistence.'
  END
FROM learning_paths
WHERE slug IN (
  'java-fundamentals', 'java-oop-collections', 'java-advanced-backend',
  'cpp-basics', 'cpp-oop-stl', 'cpp-advanced-systems',
  'csharp-dotnet', 'csharp-oop-linq', 'csharp-advanced-web'
)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

UPDATE lessons l
JOIN learning_paths lp ON lp.id = l.learning_path_id
JOIN programming_languages pl ON pl.id = lp.programming_language_id
SET l.order_position = l.order_position + 10000
WHERE pl.slug IN ('java', 'cpp', 'csharp')
  AND l.order_position < 10000;

CREATE TEMPORARY TABLE core_curriculum_seed (
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

INSERT INTO core_curriculum_seed (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code,
  title_en, description_en, content_en, explanation_en, prompt_en
) VALUES
('java-fundamentals', 'Sintaxis, main y salida en Java', 'java-sintaxis-main',
'Estructura de un programa Java, metodo main y salida con System.out.println.',
'<h2>Sintaxis, main y salida en Java</h2><p>Java organiza el codigo dentro de clases. Un programa de consola inicia en <code>public static void main(String[] args)</code>, donde se ejecutan las instrucciones principales.</p><pre><code>public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hola CodeQuest");\n  }\n}</code></pre><p>En CodeQuest empezamos observando valores por consola para confirmar que el flujo hace lo esperado.</p>',
1, 18, 50, 'mensaje',
'<code>mensaje</code> contiene el texto que debe enviarse a la consola.',
'Completa el identificador faltante para imprimir el mensaje en Java.',
'String mensaje = "Hola CodeQuest";\nSystem.out.println(_____);',
'Java syntax, main, and output',
'Java program structure, main method, and output with System.out.println.',
'<h2>Java syntax, main, and output</h2><p>Java organizes code inside classes. A console program starts in <code>public static void main(String[] args)</code>, where the main instructions run.</p><pre><code>public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello CodeQuest");\n  }\n}</code></pre><p>In CodeQuest we begin by observing console values to confirm that the flow behaves as expected.</p>',
'<code>message</code> contains the text that must be sent to the console.',
'Complete the missing identifier to print the message in Java.'),

('java-fundamentals', 'Variables, tipos y operadores', 'java-variables-tipos-operadores',
'Declaracion de datos primitivos, Strings, operadores y conversiones explicitas en Java.',
'<h2>Variables, tipos y operadores</h2><p>Java es fuertemente tipado: cada variable declara el tipo de dato que puede almacenar. Los tipos comunes incluyen <code>int</code>, <code>double</code>, <code>boolean</code>, <code>char</code> y <code>String</code>.</p><pre><code>int puntos = 80;\nint bono = 20;\nint total = puntos + bono;</code></pre><p>Usa conversiones explicitas cuando cambias de un tipo numerico a otro para evitar perder precision sin notarlo.</p>',
2, 22, 55, 'total',
'<code>total</code> guarda la suma de puntos y bono.',
'Completa el identificador faltante para imprimir el total calculado.',
'int puntos = 80;\nint bono = 20;\nint total = puntos + bono;\nSystem.out.println(_____);',
'Variables, types, and operators',
'Primitive data declarations, Strings, operators, and explicit conversions in Java.',
'<h2>Variables, types, and operators</h2><p>Java is strongly typed: each variable declares the kind of value it can store. Common types include <code>int</code>, <code>double</code>, <code>boolean</code>, <code>char</code>, and <code>String</code>.</p><pre><code>int points = 80;\nint bonus = 20;\nint total = points + bonus;</code></pre><p>Use explicit conversions when moving between numeric types so precision loss is intentional.</p>',
'<code>total</code> stores the sum of points and bonus.',
'Complete the missing identifier to print the calculated total.'),

('java-fundamentals', 'Condicionales, bucles y metodos', 'java-control-metodos',
'Toma decisiones con if/switch, repite tareas con for/while y encapsula logica en metodos.',
'<h2>Condicionales, bucles y metodos</h2><p>El control de flujo permite que un programa responda a datos diferentes. Usa <code>if</code> para decisiones, <code>switch</code> para multiples casos y bucles para repetir tareas.</p><pre><code>static boolean aprobo(int puntos) {\n  return puntos >= 60;\n}</code></pre><p>Los metodos reducen repeticion y hacen que una regla de negocio pueda probarse de forma aislada.</p>',
3, 24, 55, 'aprobo(75)',
'La llamada <code>aprobo(75)</code> retorna el booleano calculado por el metodo.',
'Completa la expresion faltante para imprimir si el estudiante aprobo.',
'static boolean aprobo(int puntos) {\n  return puntos >= 60;\n}\nSystem.out.println(_____);',
'Conditionals, loops, and methods',
'Make decisions with if/switch, repeat tasks with for/while, and encapsulate logic in methods.',
'<h2>Conditionals, loops, and methods</h2><p>Control flow lets a program respond to different data. Use <code>if</code> for decisions, <code>switch</code> for multiple cases, and loops to repeat tasks.</p><pre><code>static boolean passed(int points) {\n  return points >= 60;\n}</code></pre><p>Methods reduce repetition and make business rules easier to test in isolation.</p>',
'The call <code>passed(75)</code> returns the boolean calculated by the method.',
'Complete the missing expression to print whether the student passed.'),

('java-oop-collections', 'Clases, objetos y constructores', 'java-clases-objetos',
'Programacion orientada a objetos con Java: clases, atributos, constructores y metodos.',
'<h2>Clases, objetos y constructores</h2><p>Una clase describe una entidad: sus datos y comportamientos. Un objeto es una instancia concreta creada con <code>new</code>.</p><pre><code>class Usuario {\n  private String nombre;\n  Usuario(String nombre) { this.nombre = nombre; }\n  String getNombre() { return nombre; }\n}</code></pre><p>El constructor deja el objeto en un estado inicial valido.</p>',
1, 25, 60, 'usuario.getNombre()',
'<code>usuario.getNombre()</code> invoca el metodo que expone el nombre del objeto.',
'Completa la expresion para imprimir el nombre guardado en el objeto.',
'Usuario usuario = new Usuario("Ada");\nSystem.out.println(_____);',
'Classes, objects, and constructors',
'Object-oriented programming in Java: classes, attributes, constructors, and methods.',
'<h2>Classes, objects, and constructors</h2><p>A class describes an entity: its data and behavior. An object is a concrete instance created with <code>new</code>.</p><pre><code>class User {\n  private String name;\n  User(String name) { this.name = name; }\n  String getName() { return name; }\n}</code></pre><p>The constructor leaves the object in a valid initial state.</p>',
'<code>user.getName()</code> calls the method that exposes the object name.',
'Complete the expression to print the name stored in the object.'),

('java-oop-collections', 'Encapsulamiento, herencia e interfaces', 'java-poo-herencia-interfaces',
'Protege estado interno, reutiliza comportamiento y define contratos con interfaces.',
'<h2>Encapsulamiento, herencia e interfaces</h2><p>El encapsulamiento limita el acceso directo al estado. La herencia reutiliza comportamiento comun y las interfaces definen capacidades que una clase promete implementar.</p><pre><code>interface Calificable { int puntos(); }\nclass Reto implements Calificable {\n  public int puntos() { return 100; }\n}</code></pre><p>Prefiere interfaces pequenas cuando quieras desacoplar reglas de implementaciones concretas.</p>',
2, 28, 65, 'implements',
'La palabra clave <code>implements</code> conecta una clase con el contrato de una interfaz.',
'Completa la palabra clave para que Reto implemente Calificable.',
'interface Calificable { int puntos(); }\nclass Reto _____ Calificable {\n  public int puntos() { return 100; }\n}',
'Encapsulation, inheritance, and interfaces',
'Protect internal state, reuse behavior, and define contracts with interfaces.',
'<h2>Encapsulation, inheritance, and interfaces</h2><p>Encapsulation limits direct access to state. Inheritance reuses common behavior, and interfaces define capabilities that a class promises to implement.</p><pre><code>interface Scorable { int points(); }\nclass Challenge implements Scorable {\n  public int points() { return 100; }\n}</code></pre><p>Prefer small interfaces when decoupling rules from concrete implementations.</p>',
'The keyword <code>implements</code> connects a class to an interface contract.',
'Complete the keyword so Reto implements Calificable.'),

('java-oop-collections', 'Colecciones, genericos y excepciones', 'java-colecciones-excepciones',
'Uso de ArrayList, HashMap, genericos y manejo controlado de errores con try/catch.',
'<h2>Colecciones, genericos y excepciones</h2><p>Las colecciones permiten trabajar con grupos de datos. <code>ArrayList&lt;T&gt;</code> mantiene orden, <code>HashMap&lt;K,V&gt;</code> asocia claves y valores, y los genericos evitan castings inseguros.</p><pre><code>List&lt;String&gt; temas = new ArrayList&lt;&gt;();\ntemas.add("POO");</code></pre><p>Combina colecciones con <code>try/catch</code> cuando procesas datos externos que pueden fallar.</p>',
3, 30, 65, 'temas',
'<code>temas</code> es la lista que contiene los valores agregados.',
'Completa el identificador faltante para imprimir la lista.',
'List<String> temas = new ArrayList<>();\ntemas.add("POO");\nSystem.out.println(_____);',
'Collections, generics, and exceptions',
'Using ArrayList, HashMap, generics, and controlled error handling with try/catch.',
'<h2>Collections, generics, and exceptions</h2><p>Collections let you work with groups of data. <code>ArrayList&lt;T&gt;</code> preserves order, <code>HashMap&lt;K,V&gt;</code> associates keys and values, and generics avoid unsafe casts.</p><pre><code>List&lt;String&gt; topics = new ArrayList&lt;&gt;();\ntopics.add("OOP");</code></pre><p>Combine collections with <code>try/catch</code> when processing external data that can fail.</p>',
'<code>topics</code> is the list that contains the added values.',
'Complete the missing identifier to print the list.'),

('java-advanced-backend', 'Lambdas y Streams', 'java-lambdas-streams',
'Transforma colecciones con expresiones lambda, filtros, mapas y reducciones usando Streams.',
'<h2>Lambdas y Streams</h2><p>Las lambdas permiten pasar comportamiento como valor. La API Stream crea pipelines declarativos para transformar colecciones sin escribir bucles manuales.</p><pre><code>List&lt;Integer&gt; numeros = List.of(1, 2, 3);\nList&lt;Integer&gt; dobles = numeros.stream().map(n -&gt; n * 2).toList();</code></pre><p>Usa Streams para operaciones de lectura y transformacion; evita efectos secundarios dentro del pipeline.</p>',
1, 30, 75, 'dobles',
'<code>dobles</code> almacena el resultado del pipeline Stream.',
'Completa el identificador faltante para imprimir la lista transformada.',
'List<Integer> numeros = List.of(1, 2, 3);\nList<Integer> dobles = numeros.stream().map(n -> n * 2).toList();\nSystem.out.println(_____);',
'Lambdas and Streams',
'Transform collections with lambda expressions, filters, maps, and reductions using Streams.',
'<h2>Lambdas and Streams</h2><p>Lambdas let you pass behavior as a value. The Stream API creates declarative pipelines to transform collections without manual loops.</p><pre><code>List&lt;Integer&gt; numbers = List.of(1, 2, 3);\nList&lt;Integer&gt; doubles = numbers.stream().map(n -&gt; n * 2).toList();</code></pre><p>Use Streams for reading and transformation operations; avoid side effects inside the pipeline.</p>',
'<code>doubles</code> stores the result of the Stream pipeline.',
'Complete the missing identifier to print the transformed list.'),

('java-advanced-backend', 'Archivos, concurrencia y servicios', 'java-archivos-concurrencia',
'Lee archivos, ejecuta tareas concurrentes y prepara servicios Java para trabajo backend.',
'<h2>Archivos, concurrencia y servicios</h2><p>Java ofrece APIs estables para leer archivos, ejecutar tareas y construir servicios. <code>Files.readString</code> simplifica lectura y <code>ExecutorService</code> coordina trabajo concurrente.</p><pre><code>Path ruta = Path.of("datos.txt");\nString contenido = Files.readString(ruta);</code></pre><p>En backend, estas herramientas ayudan a procesar entradas, tareas diferidas y datos persistentes.</p>',
2, 32, 80, 'contenido',
'<code>contenido</code> guarda el texto leido desde el archivo.',
'Completa el identificador faltante para imprimir el contenido leido.',
'Path ruta = Path.of("datos.txt");\nString contenido = Files.readString(ruta);\nSystem.out.println(_____);',
'Files, concurrency, and services',
'Read files, run concurrent tasks, and prepare Java services for backend work.',
'<h2>Files, concurrency, and services</h2><p>Java offers stable APIs for reading files, executing tasks, and building services. <code>Files.readString</code> simplifies reading and <code>ExecutorService</code> coordinates concurrent work.</p><pre><code>Path path = Path.of("data.txt");\nString content = Files.readString(path);</code></pre><p>In backend work, these tools help process inputs, deferred tasks, and persistent data.</p>',
'<code>content</code> stores the text read from the file.',
'Complete the missing identifier to print the loaded content.'),

('java-advanced-backend', 'Proyecto final: API de progreso', 'java-proyecto-final-api',
'Integra clases, colecciones, Streams y manejo de errores en un mini servicio de progreso.',
'<h2>Proyecto final: API de progreso</h2><p>El cierre de la ruta combina modelo de dominio, colecciones, validaciones y transformacion de datos. El objetivo es calcular un resumen de avance listo para una respuesta de API.</p><pre><code>List&lt;Integer&gt; xp = List.of(50, 60, 70);\nint total = xp.stream().mapToInt(Integer::intValue).sum();</code></pre><p>Este tipo de flujo aparece en paneles, rankings y reportes de aprendizaje.</p>',
3, 38, 90, 'total',
'<code>total</code> contiene la suma de XP calculada con Stream.',
'Completa el identificador faltante para imprimir el total de XP.',
'List<Integer> xp = List.of(50, 60, 70);\nint total = xp.stream().mapToInt(Integer::intValue).sum();\nSystem.out.println(_____);',
'Final project: progress API',
'Integrate classes, collections, Streams, and error handling in a small progress service.',
'<h2>Final project: progress API</h2><p>The path closes by combining domain modeling, collections, validations, and data transformation. The goal is to calculate a progress summary ready for an API response.</p><pre><code>List&lt;Integer&gt; xp = List.of(50, 60, 70);\nint total = xp.stream().mapToInt(Integer::intValue).sum();</code></pre><p>This flow appears in dashboards, rankings, and learning reports.</p>',
'<code>total</code> contains the XP sum calculated with Stream.',
'Complete the missing identifier to print the XP total.'),

('cpp-basics', 'Sintaxis esencial y salida', 'cpp-sintaxis-esencial',
'Estructura de un programa C++, main, includes y salida con std::cout.',
'<h2>Sintaxis esencial y salida</h2><p>Un programa C++ suele iniciar incluyendo librerias, declarando <code>main</code> y devolviendo un codigo de salida. <code>std::cout</code> escribe datos en la consola.</p><pre><code>#include &lt;iostream&gt;\nint main() {\n  std::cout &lt;&lt; "Hola CodeQuest";\n  return 0;\n}</code></pre><p>Nombrar bien las variables hace mas simple depurar la salida.</p>',
1, 18, 50, 'total',
'<code>total</code> contiene el valor que debe enviarse a <code>std::cout</code>.',
'Completa el identificador faltante para imprimir el total en C++.',
'int total = 2 + 3;\nstd::cout << _____ << std::endl;',
'Essential syntax and output',
'C++ program structure, main, includes, and output with std::cout.',
'<h2>Essential syntax and output</h2><p>A C++ program usually starts by including libraries, declaring <code>main</code>, and returning an exit code. <code>std::cout</code> writes data to the console.</p><pre><code>#include &lt;iostream&gt;\nint main() {\n  std::cout &lt;&lt; "Hello CodeQuest";\n  return 0;\n}</code></pre><p>Clear variable names make console debugging easier.</p>',
'<code>total</code> contains the value that must be sent to <code>std::cout</code>.',
'Complete the missing identifier to print the total in C++.'),

('cpp-basics', 'Variables, tipos y conversiones', 'cpp-variables-tipos',
'Tipos fundamentales, modificadores, operadores y conversiones explicitas en C++.',
'<h2>Variables, tipos y conversiones</h2><p>C++ exige declarar tipos. Puedes trabajar con <code>int</code>, <code>double</code>, <code>char</code>, <code>bool</code> y <code>std::string</code>. Las conversiones deben ser claras cuando mezclas tipos.</p><pre><code>double precio = 19.99;\nint entero = static_cast&lt;int&gt;(precio);</code></pre><p>El tipado explicito ayuda al compilador a detectar errores antes de ejecutar.</p>',
2, 22, 55, 'entero',
'<code>entero</code> guarda el resultado de la conversion explicita.',
'Completa el identificador faltante para imprimir el valor convertido.',
'double precio = 19.99;\nint entero = static_cast<int>(precio);\nstd::cout << _____;',
'Variables, types, and conversions',
'Fundamental types, modifiers, operators, and explicit conversions in C++.',
'<h2>Variables, types, and conversions</h2><p>C++ requires explicit types. You can work with <code>int</code>, <code>double</code>, <code>char</code>, <code>bool</code>, and <code>std::string</code>. Conversions should be clear when mixing types.</p><pre><code>double price = 19.99;\nint whole = static_cast&lt;int&gt;(price);</code></pre><p>Explicit typing helps the compiler detect errors before execution.</p>',
'<code>whole</code> stores the result of the explicit conversion.',
'Complete the missing identifier to print the converted value.'),

('cpp-basics', 'Control de flujo, funciones y arrays', 'cpp-control-funciones-arrays',
'Usa if, switch, for, while, funciones y arrays para resolver problemas pequenos.',
'<h2>Control de flujo, funciones y arrays</h2><p>Las condiciones deciden caminos, los bucles repiten tareas y las funciones encapsulan reglas. Los arrays guardan secuencias de tamano fijo.</p><pre><code>int duplicar(int n) { return n * 2; }\nint resultado = duplicar(6);</code></pre><p>Separar la logica en funciones pequenas hace que el codigo sea mas facil de probar.</p>',
3, 25, 55, 'resultado',
'<code>resultado</code> almacena el retorno de la funcion <code>duplicar</code>.',
'Completa el identificador faltante para imprimir el valor retornado.',
'int duplicar(int n) { return n * 2; }\nint resultado = duplicar(6);\nstd::cout << _____;',
'Control flow, functions, and arrays',
'Use if, switch, for, while, functions, and arrays to solve small problems.',
'<h2>Control flow, functions, and arrays</h2><p>Conditions choose paths, loops repeat tasks, and functions encapsulate rules. Arrays store fixed-size sequences.</p><pre><code>int doubleValue(int n) { return n * 2; }\nint result = doubleValue(6);</code></pre><p>Splitting logic into small functions makes code easier to test.</p>',
'<code>result</code> stores the return value from the function.',
'Complete the missing identifier to print the returned value.'),

('cpp-oop-stl', 'Clases, objetos y constructores', 'cpp-clases-objetos',
'Define clases, constructores, metodos y objetos con estado propio en C++.',
'<h2>Clases, objetos y constructores</h2><p>Una clase en C++ puede agrupar datos y comportamiento. El constructor inicializa el objeto antes de usarlo.</p><pre><code>class Usuario {\npublic:\n  Usuario(std::string nombre) : nombre(nombre) {}\n  std::string getNombre() { return nombre; }\nprivate:\n  std::string nombre;\n};</code></pre><p>Separar interfaz publica y datos privados protege el estado interno.</p>',
1, 28, 60, 'usuario.getNombre()',
'<code>usuario.getNombre()</code> devuelve el nombre almacenado dentro del objeto.',
'Completa la expresion para imprimir el nombre del usuario.',
'Usuario usuario("Ada");\nstd::cout << _____;',
'Classes, objects, and constructors',
'Define classes, constructors, methods, and objects with their own state in C++.',
'<h2>Classes, objects, and constructors</h2><p>A C++ class groups data and behavior. The constructor initializes the object before it is used.</p><pre><code>class User {\npublic:\n  User(std::string name) : name(name) {}\n  std::string getName() { return name; }\nprivate:\n  std::string name;\n};</code></pre><p>Separating the public interface from private data protects internal state.</p>',
'<code>user.getName()</code> returns the name stored inside the object.',
'Complete the expression to print the user name.'),

('cpp-oop-stl', 'Referencias, punteros y RAII', 'cpp-punteros-raii',
'Comprende referencias, punteros, propiedad de recursos y liberacion segura con RAII.',
'<h2>Referencias, punteros y RAII</h2><p>Las referencias ofrecen alias seguros a objetos existentes. Los punteros representan direcciones y requieren disciplina. RAII asocia la vida de un recurso a la vida de un objeto.</p><pre><code>int valor = 10;\nint* ptr = &amp;valor;\n*ptr = 20;</code></pre><p>En C++ moderno, prefiere objetos automaticos y smart pointers antes que gestion manual.</p>',
2, 30, 65, '*ptr',
'<code>*ptr</code> desreferencia el puntero para leer el valor apuntado.',
'Completa la expresion faltante para imprimir el valor apuntado.',
'int valor = 10;\nint* ptr = &valor;\nstd::cout << _____;',
'References, pointers, and RAII',
'Understand references, pointers, resource ownership, and safe release with RAII.',
'<h2>References, pointers, and RAII</h2><p>References provide safe aliases to existing objects. Pointers represent addresses and require discipline. RAII ties a resource lifetime to an object lifetime.</p><pre><code>int value = 10;\nint* ptr = &amp;value;\n*ptr = 20;</code></pre><p>In modern C++, prefer automatic objects and smart pointers over manual management.</p>',
'<code>*ptr</code> dereferences the pointer to read the pointed value.',
'Complete the missing expression to print the pointed value.'),

('cpp-oop-stl', 'STL: vector, map y errores', 'cpp-stl-errores',
'Usa contenedores de la STL y maneja errores con excepciones controladas.',
'<h2>STL: vector, map y errores</h2><p>La Standard Template Library ofrece contenedores listos para produccion. <code>std::vector</code> crece dinamicamente y <code>std::map</code> organiza datos por clave.</p><pre><code>std::vector&lt;int&gt; puntos {50, 60, 70};\npuntos.push_back(80);</code></pre><p>Cuando una operacion puede fallar, usa excepciones o resultados explicitos segun el contexto.</p>',
3, 30, 65, 'puntos',
'<code>puntos</code> contiene los valores agregados al vector.',
'Completa el identificador faltante para imprimir el tamano del vector.',
'std::vector<int> puntos {50, 60, 70};\npuntos.push_back(80);\nstd::cout << _____.size();',
'STL: vector, map, and errors',
'Use STL containers and handle errors with controlled exceptions.',
'<h2>STL: vector, map, and errors</h2><p>The Standard Template Library provides production-ready containers. <code>std::vector</code> grows dynamically and <code>std::map</code> organizes data by key.</p><pre><code>std::vector&lt;int&gt; points {50, 60, 70};\npoints.push_back(80);</code></pre><p>When an operation can fail, use exceptions or explicit results depending on context.</p>',
'<code>points</code> contains the values added to the vector.',
'Complete the missing identifier to print the vector size.'),

('cpp-advanced-systems', 'Templates y lambdas', 'cpp-templates-lambdas',
'Crea codigo generico y pasa comportamiento con funciones lambda modernas.',
'<h2>Templates y lambdas</h2><p>Los templates permiten escribir funciones y clases reutilizables para varios tipos. Las lambdas representan funciones anonimas utiles para algoritmos de la STL.</p><pre><code>auto duplicar = [](int n) { return n * 2; };\nint resultado = duplicar(5);</code></pre><p>Combinar templates y lambdas facilita componentes flexibles sin perder rendimiento.</p>',
1, 30, 75, 'resultado',
'<code>resultado</code> guarda el valor devuelto por la lambda.',
'Completa el identificador faltante para imprimir el resultado.',
'auto duplicar = [](int n) { return n * 2; };\nint resultado = duplicar(5);\nstd::cout << _____;',
'Templates and lambdas',
'Create generic code and pass behavior with modern lambda functions.',
'<h2>Templates and lambdas</h2><p>Templates let you write functions and classes reusable across several types. Lambdas represent anonymous functions that are useful with STL algorithms.</p><pre><code>auto doubleValue = [](int n) { return n * 2; };\nint result = doubleValue(5);</code></pre><p>Combining templates and lambdas enables flexible components without sacrificing performance.</p>',
'<code>result</code> stores the value returned by the lambda.',
'Complete the missing identifier to print the result.'),

('cpp-advanced-systems', 'Memoria moderna, archivos y concurrencia', 'cpp-memoria-concurrencia',
'Trabaja con smart pointers, streams de archivo y tareas concurrentes con std::thread.',
'<h2>Memoria moderna, archivos y concurrencia</h2><p>C++ moderno reduce errores usando <code>std::unique_ptr</code>, <code>std::shared_ptr</code>, streams de archivo y primitivas de concurrencia.</p><pre><code>auto valor = std::make_unique&lt;int&gt;(42);\nstd::cout &lt;&lt; *valor;</code></pre><p>El objetivo es expresar propiedad, vida util y ejecucion paralela de forma explicita.</p>',
2, 34, 80, '*valor',
'<code>*valor</code> accede al entero gestionado por el smart pointer.',
'Completa la expresion faltante para imprimir el valor apuntado.',
'auto valor = std::make_unique<int>(42);\nstd::cout << _____;',
'Modern memory, files, and concurrency',
'Work with smart pointers, file streams, and concurrent tasks with std::thread.',
'<h2>Modern memory, files, and concurrency</h2><p>Modern C++ reduces errors with <code>std::unique_ptr</code>, <code>std::shared_ptr</code>, file streams, and concurrency primitives.</p><pre><code>auto value = std::make_unique&lt;int&gt;(42);\nstd::cout &lt;&lt; *value;</code></pre><p>The goal is to express ownership, lifetime, and parallel execution explicitly.</p>',
'<code>*value</code> accesses the integer managed by the smart pointer.',
'Complete the missing expression to print the pointed value.'),

('cpp-advanced-systems', 'Proyecto final: procesador de metricas', 'cpp-proyecto-final-metricas',
'Integra STL, algoritmos, funciones y manejo seguro de recursos en un procesador de metricas.',
'<h2>Proyecto final: procesador de metricas</h2><p>El proyecto final toma una lista de mediciones, filtra valores validos, calcula un total y prepara una salida clara. Este patron aparece en software de alto rendimiento, telemetria y analisis de logs.</p><pre><code>std::vector&lt;int&gt; xp {50, 60, 70};\nint total = std::accumulate(xp.begin(), xp.end(), 0);</code></pre><p>La clave es usar contenedores y algoritmos de la STL con intencion clara.</p>',
3, 38, 90, 'total',
'<code>total</code> contiene la suma calculada por <code>std::accumulate</code>.',
'Completa el identificador faltante para imprimir el total calculado.',
'std::vector<int> xp {50, 60, 70};\nint total = std::accumulate(xp.begin(), xp.end(), 0);\nstd::cout << _____;',
'Final project: metrics processor',
'Integrate STL, algorithms, functions, and safe resource handling in a metrics processor.',
'<h2>Final project: metrics processor</h2><p>The final project takes a list of measurements, filters valid values, calculates a total, and prepares clear output. This pattern appears in high-performance software, telemetry, and log analysis.</p><pre><code>std::vector&lt;int&gt; xp {50, 60, 70};\nint total = std::accumulate(xp.begin(), xp.end(), 0);</code></pre><p>The key is to use STL containers and algorithms with clear intent.</p>',
'<code>total</code> contains the sum calculated by <code>std::accumulate</code>.',
'Complete the missing identifier to print the calculated total.'),

('csharp-dotnet', 'Primeros pasos con C# y .NET', 'csharp-dotnet-primeros-pasos',
'Estructura de programas C#, salida por consola y ejecucion dentro del ecosistema .NET.',
'<h2>Primeros pasos con C# y .NET</h2><p>C# es el lenguaje principal del ecosistema .NET. Un programa puede iniciar con top-level statements o con una clase <code>Program</code>.</p><pre><code>Console.WriteLine("Hola CodeQuest");</code></pre><p>La consola permite verificar resultados mientras aprendes sintaxis y flujo de ejecucion.</p>',
1, 18, 50, 'mensaje',
'<code>mensaje</code> contiene el texto que debe imprimirse.',
'Completa el identificador faltante para imprimir el mensaje en C#.',
'string mensaje = "Hola CodeQuest";\nConsole.WriteLine(_____);',
'First steps with C# and .NET',
'C# program structure, console output, and execution inside the .NET ecosystem.',
'<h2>First steps with C# and .NET</h2><p>C# is the main language of the .NET ecosystem. A program can start with top-level statements or with a <code>Program</code> class.</p><pre><code>Console.WriteLine("Hello CodeQuest");</code></pre><p>The console helps verify results while learning syntax and execution flow.</p>',
'<code>message</code> contains the text that must be printed.',
'Complete the missing identifier to print the message in C#.'),

('csharp-dotnet', 'Tipos, operadores y cadenas', 'csharp-tipos-operadores-strings',
'Tipos basicos, inferencia con var, operadores y trabajo con strings interpolados.',
'<h2>Tipos, operadores y cadenas</h2><p>C# combina tipado fuerte con inferencia local usando <code>var</code>. Las cadenas interpoladas permiten construir mensajes claros con <code>$"..."</code>.</p><pre><code>int puntos = 80;\nint bono = 20;\nvar total = puntos + bono;</code></pre><p>Usa tipos explicitos cuando mejora la lectura o evita ambiguedad.</p>',
2, 22, 55, 'total',
'<code>total</code> guarda la suma calculada por la expresion.',
'Completa el identificador faltante para imprimir el total.',
'int puntos = 80;\nint bono = 20;\nvar total = puntos + bono;\nConsole.WriteLine(_____);',
'Types, operators, and strings',
'Basic types, inference with var, operators, and interpolated strings.',
'<h2>Types, operators, and strings</h2><p>C# combines strong typing with local inference using <code>var</code>. Interpolated strings build clear messages with <code>$"..."</code>.</p><pre><code>int points = 80;\nint bonus = 20;\nvar total = points + bonus;</code></pre><p>Use explicit types when they improve readability or avoid ambiguity.</p>',
'<code>total</code> stores the sum calculated by the expression.',
'Complete the missing identifier to print the total.'),

('csharp-dotnet', 'Control de flujo, metodos y listas', 'csharp-control-metodos-listas',
'Decisiones, bucles, metodos y colecciones List para resolver problemas practicos.',
'<h2>Control de flujo, metodos y listas</h2><p><code>if</code>, <code>switch</code>, <code>for</code> y <code>foreach</code> organizan decisiones y repeticiones. Los metodos encapsulan reglas reutilizables.</p><pre><code>static int Duplicar(int n) =&gt; n * 2;\nint resultado = Duplicar(6);</code></pre><p><code>List&lt;T&gt;</code> permite colecciones dinamicas de un tipo definido.</p>',
3, 25, 55, 'resultado',
'<code>resultado</code> almacena el valor retornado por el metodo.',
'Completa el identificador faltante para imprimir el resultado.',
'static int Duplicar(int n) => n * 2;\nint resultado = Duplicar(6);\nConsole.WriteLine(_____);',
'Control flow, methods, and lists',
'Decisions, loops, methods, and List collections for practical problems.',
'<h2>Control flow, methods, and lists</h2><p><code>if</code>, <code>switch</code>, <code>for</code>, and <code>foreach</code> organize decisions and repetitions. Methods encapsulate reusable rules.</p><pre><code>static int Double(int n) =&gt; n * 2;\nint result = Double(6);</code></pre><p><code>List&lt;T&gt;</code> allows dynamic collections of a defined type.</p>',
'<code>result</code> stores the value returned by the method.',
'Complete the missing identifier to print the result.'),

('csharp-oop-linq', 'Clases, propiedades y constructores', 'csharp-clases-propiedades',
'Modela entidades con clases, propiedades automaticas, constructores y metodos.',
'<h2>Clases, propiedades y constructores</h2><p>Las clases modelan entidades del dominio. Las propiedades automaticas exponen datos controlados y los constructores aseguran un estado inicial valido.</p><pre><code>class Usuario {\n  public string Nombre { get; }\n  public Usuario(string nombre) { Nombre = nombre; }\n}</code></pre><p>Este patron aparece en DTOs, modelos de dominio y respuestas de API.</p>',
1, 28, 60, 'usuario.Nombre',
'<code>usuario.Nombre</code> lee la propiedad publica del objeto.',
'Completa la expresion faltante para imprimir el nombre.',
'var usuario = new Usuario("Ada");\nConsole.WriteLine(_____);',
'Classes, properties, and constructors',
'Model entities with classes, automatic properties, constructors, and methods.',
'<h2>Classes, properties, and constructors</h2><p>Classes model domain entities. Automatic properties expose controlled data and constructors guarantee a valid initial state.</p><pre><code>class User {\n  public string Name { get; }\n  public User(string name) { Name = name; }\n}</code></pre><p>This pattern appears in DTOs, domain models, and API responses.</p>',
'<code>user.Name</code> reads the public property of the object.',
'Complete the missing expression to print the name.'),

('csharp-oop-linq', 'Interfaces, excepciones y LINQ', 'csharp-interfaces-linq',
'Define contratos, captura errores y transforma colecciones con consultas LINQ.',
'<h2>Interfaces, excepciones y LINQ</h2><p>Las interfaces separan lo que una clase puede hacer de como lo hace. Las excepciones controlan fallos y LINQ permite consultar colecciones de forma declarativa.</p><pre><code>var activos = usuarios.Where(u =&gt; u.Activo).ToList();</code></pre><p>LINQ reduce bucles repetitivos y expresa la intencion de filtrado, proyeccion o agrupacion.</p>',
2, 30, 65, 'activos',
'<code>activos</code> contiene la lista filtrada por LINQ.',
'Completa el identificador faltante para imprimir la cantidad de usuarios activos.',
'var activos = usuarios.Where(u => u.Activo).ToList();\nConsole.WriteLine(_____.Count);',
'Interfaces, exceptions, and LINQ',
'Define contracts, capture errors, and transform collections with LINQ queries.',
'<h2>Interfaces, exceptions, and LINQ</h2><p>Interfaces separate what a class can do from how it does it. Exceptions control failures and LINQ queries collections declaratively.</p><pre><code>var active = users.Where(u =&gt; u.Active).ToList();</code></pre><p>LINQ reduces repetitive loops and expresses filtering, projection, or grouping intent.</p>',
'<code>active</code> contains the list filtered by LINQ.',
'Complete the missing identifier to print the number of active users.'),

('csharp-oop-linq', 'Async await y tareas', 'csharp-async-await',
'Ejecuta operaciones asincronas con Task, async, await y manejo de errores.',
'<h2>Async await y tareas</h2><p>Las aplicaciones modernas esperan APIs, archivos y bases de datos sin bloquear la interfaz o el servidor. <code>Task</code> representa trabajo futuro y <code>await</code> espera su resultado.</p><pre><code>async Task&lt;string&gt; CargarAsync() {\n  await Task.Delay(100);\n  return "OK";\n}</code></pre><p>Combina <code>try/catch</code> con <code>await</code> para controlar fallos de red o E/S.</p>',
3, 30, 70, 'respuesta',
'<code>respuesta</code> guarda el valor devuelto por la tarea asincrona.',
'Completa el identificador faltante para imprimir la respuesta.',
'string respuesta = await CargarAsync();\nConsole.WriteLine(_____);',
'Async await and tasks',
'Run asynchronous operations with Task, async, await, and error handling.',
'<h2>Async await and tasks</h2><p>Modern applications wait for APIs, files, and databases without blocking the UI or server. <code>Task</code> represents future work and <code>await</code> waits for its result.</p><pre><code>async Task&lt;string&gt; LoadAsync() {\n  await Task.Delay(100);\n  return "OK";\n}</code></pre><p>Combine <code>try/catch</code> with <code>await</code> to control network or I/O failures.</p>',
'<code>response</code> stores the value returned by the async task.',
'Complete the missing identifier to print the response.'),

('csharp-advanced-web', 'Genericos, delegados y eventos', 'csharp-genericos-delegados',
'Crea componentes reutilizables con genericos y pasa comportamiento con delegados y eventos.',
'<h2>Genericos, delegados y eventos</h2><p>Los genericos permiten escribir codigo reutilizable con seguridad de tipos. Los delegados representan referencias a funciones y los eventos publican cambios a otros componentes.</p><pre><code>Func&lt;int, int&gt; duplicar = n =&gt; n * 2;\nint resultado = duplicar(5);</code></pre><p>Estos recursos son comunes en librerias, UI, APIs y procesamiento de eventos.</p>',
1, 30, 75, 'resultado',
'<code>resultado</code> almacena el valor devuelto por el delegado.',
'Completa el identificador faltante para imprimir el resultado.',
'Func<int, int> duplicar = n => n * 2;\nint resultado = duplicar(5);\nConsole.WriteLine(_____);',
'Generics, delegates, and events',
'Create reusable components with generics and pass behavior with delegates and events.',
'<h2>Generics, delegates, and events</h2><p>Generics let you write reusable code with type safety. Delegates represent function references and events publish changes to other components.</p><pre><code>Func&lt;int, int&gt; doubleValue = n =&gt; n * 2;\nint result = doubleValue(5);</code></pre><p>These tools are common in libraries, UI, APIs, and event processing.</p>',
'<code>result</code> stores the value returned by the delegate.',
'Complete the missing identifier to print the result.'),

('csharp-advanced-web', 'JSON, Minimal APIs y persistencia', 'csharp-json-minimal-api',
'Procesa JSON, expone endpoints con ASP.NET Minimal APIs y prepara persistencia con Entity Framework.',
'<h2>JSON, Minimal APIs y persistencia</h2><p>C# y .NET integran herramientas para construir APIs. Puedes serializar JSON, exponer rutas con Minimal APIs y conectar persistencia con Entity Framework.</p><pre><code>var resumen = JsonSerializer.Serialize(new { total = 180 });</code></pre><p>El objetivo es transformar datos de dominio en respuestas claras para clientes web.</p>',
2, 34, 80, 'resumen',
'<code>resumen</code> contiene el texto JSON serializado.',
'Completa el identificador faltante para imprimir el JSON generado.',
'var resumen = JsonSerializer.Serialize(new { total = 180 });\nConsole.WriteLine(_____);',
'JSON, Minimal APIs, and persistence',
'Process JSON, expose endpoints with ASP.NET Minimal APIs, and prepare persistence with Entity Framework.',
'<h2>JSON, Minimal APIs, and persistence</h2><p>C# and .NET integrate tools for building APIs. You can serialize JSON, expose routes with Minimal APIs, and connect persistence with Entity Framework.</p><pre><code>var summary = JsonSerializer.Serialize(new { total = 180 });</code></pre><p>The goal is to transform domain data into clear responses for web clients.</p>',
'<code>summary</code> contains the serialized JSON text.',
'Complete the missing identifier to print the generated JSON.'),

('csharp-advanced-web', 'Proyecto final: API de ranking', 'csharp-proyecto-final-ranking',
'Integra LINQ, async, JSON y endpoints para construir una API pequena de ranking.',
'<h2>Proyecto final: API de ranking</h2><p>El proyecto final calcula un ranking a partir de usuarios, XP y progreso. Combina consultas LINQ, transformacion de datos, serializacion JSON y estructura de endpoint.</p><pre><code>var top = usuarios.OrderByDescending(u =&gt; u.Xp).Take(3).ToList();</code></pre><p>Este flujo refleja reportes reales en plataformas gamificadas como CodeQuest.</p>',
3, 38, 90, 'top',
'<code>top</code> contiene los primeros usuarios ordenados por XP.',
'Completa el identificador faltante para imprimir la cantidad de usuarios seleccionados.',
'var top = usuarios.OrderByDescending(u => u.Xp).Take(3).ToList();\nConsole.WriteLine(_____.Count);',
'Final project: ranking API',
'Integrate LINQ, async, JSON, and endpoints to build a small ranking API.',
'<h2>Final project: ranking API</h2><p>The final project calculates a ranking from users, XP, and progress. It combines LINQ queries, data transformation, JSON serialization, and endpoint structure.</p><pre><code>var top = users.OrderByDescending(u =&gt; u.Xp).Take(3).ToList();</code></pre><p>This flow reflects real reports in gamified platforms such as CodeQuest.</p>',
'<code>top</code> contains the top users sorted by XP.',
'Complete the missing identifier to print the selected user count.');

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward
)
SELECT
  lp.id, seed.title, seed.slug, seed.description, seed.content,
  seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM core_curriculum_seed seed
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
FROM core_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  content = VALUES(content);

INSERT INTO lesson_solutions (
  lesson_id, language_id, solution_code, explanation, prompt, base_code
)
SELECT
  l.id, pl.id, seed.solution_code, seed.explanation, seed.prompt, seed.base_code
FROM core_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE
  language_id = VALUES(language_id),
  solution_code = VALUES(solution_code),
  explanation = VALUES(explanation),
  prompt = VALUES(prompt),
  base_code = VALUES(base_code);

INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM core_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
JOIN lesson_solutions ls ON ls.lesson_id = l.id
ON DUPLICATE KEY UPDATE
  explanation = VALUES(explanation),
  prompt = VALUES(prompt);

DELETE ltc
FROM lesson_test_cases ltc
JOIN lessons l ON l.id = ltc.lesson_id
JOIN core_curriculum_seed seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica la variable o expresion indicada en el ejercicio.', 0, 10, 1
FROM core_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe ejecutarse sin errores de sintaxis.', 0, 10, 2
FROM core_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Mantiene una salida clara para consola.', 1, 10, 3
FROM core_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE core_curriculum_seed;

COMMIT;
