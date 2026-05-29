-- CodeQuest Go curriculum expansion.
-- Adapted from standard progressive learning pathways and tailored for CodeQuest.
-- No third-party tutorial text is copied.

START TRANSACTION;

-- 1. Insert or update the learning paths for Go (programming_language_id = 6)
INSERT INTO learning_paths (
  programming_language_id, name, slug, description, difficulty_level, estimated_hours, is_optional, order_position, is_active
) VALUES 
(6, 'Go desde Cero', 'go-basics', 'Aprende los fundamentos de Go: variables, tipos de datos, control de flujo y bucles.', 'principiante', 40, 0, 1, 1),
(6, 'Go Intermedio', 'go-intermediate', 'Domina arrays, slices, maps, funciones, punteros, structs e interfaces en Go.', 'intermedio', 50, 0, 2, 1),
(6, 'Go Avanzado', 'go-advanced', 'Profundiza en control de errores, concurrencia (goroutines, canales, select), genericos y gestion del contexto en Go.', 'avanzado', 60, 0, 3, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  difficulty_level = VALUES(difficulty_level),
  estimated_hours = VALUES(estimated_hours),
  is_optional = VALUES(is_optional),
  order_position = VALUES(order_position),
  is_active = VALUES(is_active);

-- 2. Insert learning path translations
INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'es', name, description FROM learning_paths WHERE programming_language_id = 6
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'en',
  CASE slug
    WHEN 'go-basics' THEN 'Go from Scratch'
    WHEN 'go-intermediate' THEN 'Intermediate Go'
    WHEN 'go-advanced' THEN 'Advanced Go'
  END,
  CASE slug
    WHEN 'go-basics' THEN 'Learn the fundamentals of Go: variables, data types, control flow, and loops.'
    WHEN 'go-intermediate' THEN 'Master arrays, slices, maps, functions, pointers, structs, and interfaces in Go.'
    WHEN 'go-advanced' THEN 'Go deep into error handling, concurrency (goroutines, channels, select), generics, and context management in Go.'
  END
FROM learning_paths
WHERE programming_language_id = 6
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 3. Create temporary table to stage lessons, solutions, prompts, and translations
CREATE TEMPORARY TABLE go_curriculum_seed (
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

-- 4. Insert curriculum stage records
INSERT INTO go_curriculum_seed (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code,
  title_en, description_en, content_en, explanation_en, prompt_en
) VALUES
-- PATH: go-basics
('go-basics', 'Introducción a Go y Salida Estándar', 'go-introduccion',
 'Conoce el origen de Go, su filosofía de simplicidad y aprende a imprimir texto usando fmt.Println.',
 '<h2>Introducción a Go</h2><p>Go (o Golang) es un lenguaje compilado de código abierto, diseñado por Google en 2007 para ofrecer un entorno de desarrollo eficiente, simple y altamente concurrente. Es el lenguaje detrás de herramientas como Docker y Kubernetes.</p><h3>Salida por Consola</h3><p>Para imprimir datos estructurados, importamos el paquete estándar <code>fmt</code> y llamamos al método <code>Println</code>.</p><pre><code>package main\nimport "fmt"\nfunc main() {\n    fmt.Println("¡Hola, CodeQuest!")\n}</code></pre>',
 1, 15, 50, 'fmt',
 'El paquete <code>fmt</code> proporciona funciones de entrada/salida formateadas, como <code>Println</code>.',
 'Completa el paquete para imprimir el mensaje "Hola" en consola en Go.',
 'package main\nimport "_____"\nfunc main() {\n  fmt.Println("Hola")\n}',
 'Introduction to Go and Standard Output', 'Discover Go\'s origins, philosophy, and learn how to print text using fmt.Println.',
 '<h2>Introduction to Go</h2><p>Go (or Golang) is an open-source compiled language designed by Google in 2007 to provide a highly concurrent, simple, and efficient runtime. It powers foundational modern tools like Docker and Kubernetes.</p><h3>Console Output</h3><p>To print structured data, we import the standard package <code>fmt</code> and call <code>Println</code>.</p><pre><code>package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, CodeQuest!")\n}</code></pre>',
 'The <code>fmt</code> package provides formatted I/O functions, including <code>Println</code>.',
 'Complete the package import to print the "Hola" message in Go.'),

('go-basics', 'Variables y Declaración Corta', 'go-variables',
 'Aprende a declarar variables con var y utilizando el operador de declaración corta :=.',
 '<h2>Variables en Go</h2><p>Go es de tipado estático pero permite inferencia de tipos:</p><ul><li><strong>Var clásica</strong>: Se declara indicando el tipo (<code>var x int = 10</code>).</li><li><strong>Declaración corta</strong>: Utiliza el operador <code>:=</code> dentro de funciones. Go deduce el tipo automáticamente.</li></ul><pre><code>contador := 0\nmensaje := "Ruta iniciada"</code></pre>',
 2, 18, 50, ':=',
 'El operador <code>:=</code> declara e inicializa una variable en Go de forma corta.',
 'Completa la línea para declarar e inicializar la variable "version" con el valor 1.21.',
 'package main\nimport "fmt"\nfunc main() {\n  version _____ 1.21\n  fmt.Println(version)\n}',
 'Variables and Short Declaration', 'Learn to declare variables with var and using the short declaration operator :=.',
 '<h2>Variables in Go</h2><p>Go is statically typed but supports type inference:</p><ul><li><strong>Classic Var</strong>: Declared explicitly with its type (<code>var x int = 10</code>).</li><li><strong>Short Declaration</strong>: Declared using the <code>:=</code> operator inside functions. Go deduces the type automatically.</li></ul><pre><code>count := 0\nmessage := "Path started"</code></pre>',
 'The <code>:=</code> operator declares and initializes a variable in Go using type inference.',
 'Complete the line to declare and initialize the variable "version" with the value 1.21.'),

('go-basics', 'Constantes e Iota', 'go-constantes',
 'Descubre cómo declarar constantes y usar el generador iota para enumeraciones.',
 '<h2>Constantes en Go</h2><p>Las constantes se definen con la palabra clave <code>const</code>. No pueden modificarse durante la ejecución del programa.</p><h3>El identificador especial iota</h3><p>Dentro de un bloque de constantes (<code>const (...)</code>), <code>iota</code> simplifica definiciones autoincrementales, comenzando en 0 y sumando 1 por cada constante consecutiva.</p>',
 3, 20, 50, 'iota',
 '<code>iota</code> es un generador de constantes autoincrementales muy común en bloques de constantes.',
 'Completa el bloque de constantes para asignar valores autoincrementales iniciando en 0.',
 'package main\nimport "fmt"\nconst (\n  A = _____\n  B\n  C\n)\nfunc main() {\n  fmt.Println(A, B, C)\n}',
 'Constants and Iota', 'Learn to declare constants and use the special iota generator for auto-incrementing enums.',
 '<h2>Constants in Go</h2><p>Constants are defined with the <code>const</code> keyword. They cannot be modified at runtime.</p><h3>The iota Identifier</h3><p>Inside constant blocks (<code>const (...)</code>), <code>iota</code> simplifies auto-incrementing definitions, starting at 0 and adding 1 for each successive constant.',
 '<code>iota</code> is an auto-incrementing constant generator commonly used in constant groups.',
 'Complete the constant group block to assign auto-incrementing values starting at 0.'),

('go-basics', 'Operadores y Aritmética', 'go-operadores',
 'Comprende los operadores aritméticos, lógicos y relacionales básicos en Go.',
 '<h2>Operadores en Go</h2><p>Go soporta los operadores tradicionales. Al ser fuertemente tipado, no permite operaciones aritméticas mixtas de forma implícita (ej. no puedes sumar un <code>float64</code> y un <code>int</code> sin casting explícito).</p>',
 4, 18, 50, 'total',
 'La variable <code>total</code> almacena el residuo de dividir 10 entre 3 (que es 1).',
 'Completa la llamada a la consola para imprimir el valor de la variable "total".',
 'package main\nimport "fmt"\nfunc main() {\n  total := 10 % 3\n  fmt.Println(_____)\n}',
 'Operators and Arithmetic', 'Understand arithmetic, logical, and relational operators in Go.',
 '<h2>Operators in Go</h2><p>Go supports standard operators. Being strongly typed, it prohibits implicit mixed arithmetic operations (e.g. you cannot add a <code>float64</code> and an <code>int</code> without explicit conversion).</p>',
 'The variable <code>total</code> stores the modulo remainder of 10 divided by 3 (which is 1).',
 'Complete the print statement to output the value of "total".'),

('go-basics', 'Condicionales con Inicialización', 'go-condicionales',
 'Aprende a estructurar sentencias if/else y cómo inicializar variables cortas en la misma línea de la condición.',
 '<h2>Condicionales en Go</h2><p>Además de la estructura <code>if/else</code> común, Go permite inicializar variables locales directamente antes de evaluar la condición. Estas variables solo están disponibles en el ámbito del bloque condicional.</p><pre><code>if x := calcular(); x &gt; 0 {\n  fmt.Println(x)\n}</code></pre>',
 5, 20, 50, 'activo',
 'Se evalúa la variable local <code>activo</code> directamente en la condición de la sentencia <code>if</code>.',
 'Completa la condición del bloque if utilizando la variable inicializada localmente.',
 'package main\nimport "fmt"\nfunc main() {\n  if activo := true; _____ {\n    fmt.Println("Sistema activo")\n  }\n}',
 'Conditionals with Initialization', 'Learn structured if/else statements and how to initialize variables within the conditional scope.',
 '<h2>Conditionals in Go</h2><p>Alongside standard <code>if/else</code> patterns, Go allows declaring variables directly inside the conditional statement block. Variables declared here are scoped only to the conditional block.</p><pre><code>if x := evaluate(); x &gt; 0 {\n  fmt.Println(x)\n}</code></pre>',
 'The locally initialized variable <code>activo</code> is evaluated inside the <code>if</code> condition statement.',
 'Complete the condition in the if block using the locally initialized variable.'),

('go-basics', 'Selección con Switch', 'go-switch',
 'Utiliza switch en Go de forma segura. En Go, no hay "fallthrough" automático entre casos.',
 '<h2>Sentencias Switch</h2><p>El bloque <code>switch</code> evalúa múltiples coincidencias de forma limpia. A diferencia de C o Java, Go no requiere la sentencia <code>break</code> al final de cada caso; la ejecución se detiene automáticamente a menos que uses explícitamente <code>fallthrough</code>.</p>',
 6, 20, 50, 'case',
 'La palabra clave <code>case</code> define la condición de coincidencia en el bloque de selección.',
 'Completa la sentencia switch para capturar la coincidencia con el rol "admin".',
 'package main\nimport "fmt"\nfunc main() {\n  rol := "admin"\n  switch rol {\n  _____ "admin":\n    fmt.Println("Acceso total")\n  default:\n    fmt.Println("Acceso restringido")\n  }\n}',
 'Switch Statements', 'Learn how to write switch statements. In Go, cases do not fall through by default.',
 '<h2>Switch Statements</h2><p>The <code>switch</code> block evaluates multiple options cleanly. Unlike C or Java, Go does not require a <code>break</code> statement at the end of each case; execution stops automatically unless <code>fallthrough</code> is declared.</p>',
 'The <code>case</code> keyword defines matching conditions in the selection block.',
 'Complete the switch statement to match the "admin" role case.'),

('go-basics', 'Bucles con For', 'go-bucles',
 'Domina el bucle for en Go. Al ser la única estructura de repetición, sirve como loop tradicional, while y bucle infinito.',
 '<h2>El Bucle For</h2><p>Go tiene una sola palabra clave para bucles: <code>for</code>. Esta puede usarse en tres formas:</p><ul><li><strong>Tradicional</strong>: <code>for i := 0; i &lt; 10; i++</code>.</li><li><strong>Bucle Condicional (While)</strong>: <code>for condicion</code>.</li><li><strong>Bucle Infinito</strong>: <code>for</code> sin parámetros.</li></ul>',
 7, 20, 50, 'for',
 '<code>for</code> sin ninguna condición se ejecuta de manera indefinida hasta encontrar un <code>break</code>.',
 'Completa la línea para definir el bucle infinito que se detendrá inmediatamente.',
 'package main\nimport "fmt"\nfunc main() {\n  _____ {\n    fmt.Println("Detenido")\n    break\n  }\n}',
 'Loops with For', 'Master the for loop. As Go\'s only iteration statement, it acts as a loop, while, and infinite loop.',
 '<h2>The For Loop</h2><p>Go only has one loop keyword: <code>for</code>. It is used in three main styles:</p><ul><li><strong>Traditional</strong>: <code>for i := 0; i &lt; 10; i++</code>.</li><li><strong>Condition Loop (While)</strong>: <code>for condition</code>.</li><li><strong>Infinite Loop</strong>: <code>for</code> with no clauses.</li></ul>',
 '<code>for</code> with no conditional clauses acts as an infinite loop until it hits a <code>break</code>.',
 'Complete the line to write the infinite loop that breaks immediately.'),

-- PATH: go-intermediate
('go-intermediate', 'Arrays y Colecciones Fijas', 'go-arrays',
 'Aprende a definir colecciones de longitud fija y comprende por qué la longitud es parte de su tipo.',
 '<h2>Arrays en Go</h2><p>Los arrays almacenan elementos de un único tipo en una secuencia consecutiva. Su longitud es de tamaño fijo y es parte indisoluble de su definición (ej. <code>[3]int</code> es un tipo diferente de <code>[5]int</code>).</p>',
 1, 20, 60, '[3]',
 'En Go, el tamaño del array se indica entre corchetes <code>[3]</code> y es una propiedad inmutable de su tipo.',
 'Define un array de enteros que contenga exactamente 3 elementos.',
 'package main\nimport "fmt"\nfunc main() {\n  var numeros _____int = [3]int{1, 2, 3}\n  fmt.Println(numeros)\n}',
 'Arrays and Fixed-size Collections', 'Learn to define fixed-length collections and why array length is part of its type.',
 '<h2>Arrays in Go</h2><p>Arrays store elements of the same type in sequential memory. Their size is fixed at compile-time and is part of their type system (e.g. <code>[3]int</code> is a distinct type from <code>[5]int</code>).</p>',
 'In Go, array sizes are defined within square brackets <code>[3]</code> and are immutable characteristics of their type.',
 'Define an integer array that holds exactly 3 elements.'),

('go-intermediate', 'Slices: Segmentos Dinámicos', 'go-slices',
 'Domina los Slices de Go. Aprende sobre make, append, capacidad y longitud.',
 '<h2>Slices en Go</h2><p>Los Slices son segmentos dinámicos construidos sobre arrays subyacentes. Tienen longitud variable y son la estructura de datos secuenciales más utilizada en Go. Se manipulan usando la función integrada <code>append</code>.</p>',
 2, 22, 60, 'append',
 'El método builtin <code>append</code> añade elementos al final del slice, reasignando memoria si la capacidad se excede.',
 'Completa la línea para agregar el elemento "C" al final del slice "cadenas".',
 'package main\nimport "fmt"\nfunc main() {\n  cadenas := []string{"A", "B"}\n  cadenas = _____(cadenas, "C")\n  fmt.Println(cadenas)\n}',
 'Slices: Dynamic Collections', 'Master Go slices. Learn about make, append, capacity, and length.',
 '<h2>Slices in Go</h2><p>Slices are dynamic views built over underlying arrays. They feature variable lengths and are the primary sequential data structure in Go. Slices are manipulated using the built-in <code>append</code> function.</p>',
 'The built-in <code>append</code> function adds elements to the end of a slice, growing capacity dynamically.',
 'Complete the line to append the string "C" to the end of the slice "cadenas".'),

('go-intermediate', 'Maps: Colecciones Clave-Valor', 'go-maps',
 'Estructura diccionarios eficientes y aprende a comprobar de forma segura si una clave existe.',
 '<h2>Maps en Go</h2><p>Los Maps son tablas hash asociativas. Se declaran con <code>make(map[clave]valor)</code>. Al leer un valor de un mapa, Go retorna opcionalmente un booleano adicional indicando si la clave existe en el mapa.</p><pre><code>valor, existe := mapa["clave"]</code></pre>',
 3, 22, 60, 'ok',
 'La segunda variable devuelta al leer un mapa (comúnmente llamada <code>ok</code>) es un booleano que indica si la clave existe.',
 'Completa la lectura del mapa para capturar si la clave de España "ES" existe.',
 'package main\nimport "fmt"\nfunc main() {\n  capitales := make(map[string]string)\n  capitales["ES"] = "Madrid"\n  capital, _____ := capitales["ES"]\n  fmt.Println(capital, ok)\n}',
 'Maps: Key-Value Collections', 'Build key-value dictionaries and learn how to safely assert if a key exists.',
 '<h2>Maps in Go</h2><p>Maps are hash-table representations of key-value pairs, created with <code>make(map[keyType]valueType)</code>. Reading keys in Go returns a second optional boolean that asserts if the key exists.</p><pre><code>value, exists := myMap["key"]</code></pre>',
 'The second return argument (often named <code>ok</code>) is a boolean indicating key presence.',
 'Complete the map read statement to fetch if the key "ES" exists in the map.'),

('go-intermediate', 'Funciones y Retornos Múltiples', 'go-funciones',
 'Encapsula lógica en funciones que devuelven más de un valor, un patrón muy usado para el control de errores.',
 '<h2>Funciones en Go</h2><p>Las funciones soportan el retorno de múltiples valores. Esta propiedad se aprovecha en el diseño de Go para propagar errores de forma explícita de la mano del tipo <code>error</code>.</p>',
 4, 20, 60, 'error',
 'El tipo <code>error</code> es la interfaz builtin estándar de Go para modelar y propagar fallos.',
 'Completa el tipo de retorno secundario para la función "dividir".',
 'package main\nimport "fmt"\nfunc dividir(a, b float64) (float64, _____) {\n  if b == 0 {\n    return 0, fmt.Errorf("cero")\n  }\n  return a / b, nil\n}',
 'Functions and Multiple Return Values', 'Encapsulate logic in functions that return multiple values, a key Go pattern for error propagation.',
 '<h2>Functions in Go</h2><p>Functions support returning multiple values. Go relies on this design to explicitly return errors using the built-in <code>error</code> interface type alongside functional outputs.</p>',
 'The <code>error</code> type is Go\'s built-in interface for expressing and propagating errors.',
 'Complete the second return type signature for the "dividir" function.'),

('go-intermediate', 'Punteros y Direccionamiento', 'go-punteros',
 'Comprende los punteros en Go mediante los operadores & y *, y aprende cuándo pasar valores por referencia.',
 '<h2>Punteros en Go</h2><p>Los punteros almacenan la dirección de memoria de una variable. Se utiliza <code>&amp;</code> para obtener la dirección y <code>*</code> para desreferenciar y acceder/modificar el valor original.</p><pre><code>var p *int = &amp;x\n*p = 21 // Modifica x</code></pre>',
 5, 24, 60, '*x',
 'Se utiliza <code>*x</code> para desreferenciar el puntero y modificar directamente el valor en la dirección de memoria.',
 'Completa el método para incrementar el valor en memoria apuntado por "x".',
 'package main\nimport "fmt"\nfunc incrementar(x *int) {\n  _____ = *x + 1\n}',
 'Pointers and Memory Addressing', 'Understand pointer basics in Go using the & and * operators, and how to pass variables by reference.',
 '<h2>Pointers in Go</h2><p>Pointers hold the memory address of a value. We use the <code>&amp;</code> operator to query addresses, and the <code>*</code> operator to dereference and write values back to the memory target.</p><pre><code>var p *int = &amp;x\n*p = 21 // Mutates x</code></pre>',
 'We write <code>*x</code> to dereference the pointer target and mutate the underlying value.',
 'Complete the method to increment the memory target pointed to by "x".'),

('go-intermediate', 'Estructuras de Datos (Structs)', 'go-structs',
 'Agrupa datos heterogéneos bajo un mismo tipo y aprende a inicializar estructuras con Go.',
 '<h2>Estructuras en Go</h2><p>Los Structs permiten agrupar campos con diferentes tipos para estructurar objetos o entidades de negocio. Se declaran utilizando las palabras clave <code>type Name struct</code>.</p>',
 6, 22, 60, 'type',
 'La palabra clave <code>type</code> declara una nueva estructura o tipo personalizado en el paquete de Go.',
 'Completa la línea para definir el tipo estructura "Usuario".',
 'package main\nimport "fmt"\n_____ Usuario struct {\n  Nombre string\n  Edad   int\n}',
 'Structs', 'Group heterogeneous data fields under a single structural type and initialize structs in Go.',
 '<h2>Structs in Go</h2><p>Structs allow you to collect typed fields into single custom objects or models. They are defined using the <code>type Name struct</code> syntax.',
 'The <code>type</code> keyword defines a new custom type or structure in Go packages.',
 'Complete the line to define the custom "Usuario" struct type.'),

('go-intermediate', 'Métodos e Interfaces', 'go-metodos-interfaces',
 'Agrega comportamiento a tus structs mediante métodos y utiliza interfaces implícitas para lograr polimorfismo.',
 '<h2>Métodos e Interfaces</h2><p>En Go, los métodos se asocian a structs declarando un "receptor" antes del nombre del método. Las interfaces se satisfacen de forma **implícita**: no hay palabra clave `implements`. Si un struct tiene todos los métodos de una interfaz, la implementa automáticamente.</p>',
 7, 26, 65, 'Calculador',
 'Cualquier tipo que implemente el método <code>Area() float64</code> satisface implícitamente la interfaz <code>Calculador</code>.',
 'Completa el nombre de la interfaz para agrupar métodos de cálculo de área.',
 'package main\nimport "fmt"\ntype Rectangulo struct{ Ancho, Alto float64 }\nfunc (r Rectangulo) Area() float64 { return r.Ancho * r.Alto }\ntype _____ interface {\n  Area() float64\n}',
 'Methods and Interfaces', 'Add behaviors to structs using methods and implement implicit interfaces for structural polymorphism.',
 '<h2>Methods and Interfaces</h2><p>In Go, methods are bound to structs using a "receiver" syntax. Interfaces are implemented **implicitly**; there is no `implements` keyword. If a struct implements all interface methods, it satisfies that interface type automatically.</p>',
 'Any struct that implements the method <code>Area() float64</code> satisfies the <code>Calculador</code> interface type.',
 'Complete the interface identifier name to group Area methods.'),

-- PATH: go-advanced
('go-advanced', 'Manejo de Errores: Defer, Panic y Recover', 'go-defer-panic-recover',
 'Domina defer para liberar recursos y aprende a lanzar pánicos y capturarlos con recover.',
 '<h2>Defer, Panic y Recover</h2><p>Go maneja eventos excepcionales con tres primitivas:</p><ul><li><code>defer</code>: Pospone la ejecución de una función hasta que la función contenedora termina.</li><li><code>panic</code>: Interrumpe el flujo normal del programa por errores críticos.</li><li><code>recover</code>: Detiene un pánico en curso dentro de un bloque diferido para estabilizar el sistema.</li></ul>',
 1, 28, 75, 'defer',
 '<code>defer</code> pospone la ejecución de la función anónima hasta el retorno de la función contenedora.',
 'Completa la línea para registrar la función anónima que atrapará el pánico.',
 'package main\nimport "fmt"\nfunc main() {\n  _____ func() {\n    if r := recover(); r != nil {\n      fmt.Println("Estable")\n    }\n  }()\n  panic("Error")\n}',
 'Defer, Panic, and Recover', 'Master defer for resource management, raising exceptions with panic, and catching them with recover.',
 '<h2>Defer, Panic, and Recover</h2><p>Go handles exceptional control flows with three keywords:</p><ul><li><code>defer</code>: Postpones function execution until the surrounding function exits.</li><li><code>panic</code>: Stops standard execution flow due to fatal runtime issues.</li><li><code>recover</code>: Recovers execution control from active panics inside deferred functions.</li></ul>',
 'The <code>defer</code> keyword queues the anonymous recovery function to run before the function returns.',
 'Complete the line to register the anonymous function that recovers from the active panic.'),

('go-advanced', 'Concurrencia con Goroutines', 'go-concurrencia-goroutines',
 'Crea hilos ligeros controlados por el runtime de Go usando simplemente la palabra clave go.',
 '<h2>Goroutines en Go</h2><p>Una Goroutine es un hilo de ejecución concurrente y extremadamente ligero, gestionado por el planificador de Go (M:N scheduler). Lanzar una goroutine requiere simplemente anteponer la palabra clave <code>go</code> a una llamada a función.</p>',
 2, 28, 75, 'go',
 'La palabra clave <code>go</code> ejecuta la función indicada de forma asíncrona dentro de una nueva goroutine.',
 'Ejecuta la función "procesar" de forma concurrente.',
 'package main\nimport "fmt"\nfunc procesar() {\n  fmt.Println("Listo")\n}\nfunc main() {\n  _____ procesar()\n}',
 'Concurrency with Goroutines', 'Spawn lightweight concurrent threads scheduled by the Go runtime using the go keyword.',
 '<h2>Goroutines in Go</h2><p>A Goroutine is an extremely lightweight concurrent thread managed by the Go runtime scheduler. Launching a goroutine simply requires placing the keyword <code>go</code> before a function call.</p>',
 'The <code>go</code> keyword triggers asynchronous execution of the method in a new goroutine.',
 'Execute the "procesar" function concurrently.'),

('go-advanced', 'Canales y Comunicación', 'go-canales',
 'Conecta tus goroutines de forma segura usando canales para enviar y recibir datos sin bloqueos ni colisiones.',
 '<h2>Canales en Go</h2><p>Los canales son conductos a través de los cuales fluyen datos de forma segura entre goroutines, eliminando condiciones de carrera. Se crean con <code>make(chan Tipo)</code> e interactúan con el operador flecha <code>&lt;-</code>.</p>',
 3, 30, 80, 'chan',
 'Se utiliza el modificador de tipo <code>chan</code> para indicar que la variable representa un canal de comunicación.',
 'Completa la creación del canal de comunicación para el paso de enteros.',
 'package main\nimport "fmt"\nfunc main() {\n  ch := make(_____ int)\n  go func() { ch <- 42 }()\n  val := <-ch\n  fmt.Println(val)\n}',
 'Channels and Communication', 'Link concurrent threads using typed channels to transfer data safely without race conditions.',
 '<h2>Channels in Go</h2><p>Channels are typed conduits that let goroutines exchange values safely, preventing race conditions. They are allocated with <code>make(chan DataType)</code> and use arrow operators <code>&lt;-</code>.',
 'The <code>chan</code> keyword establishes that the variable is a communication channel.',
 'Complete the allocation for a new channel transmitting integer values.'),

('go-advanced', 'Multiplexación con Select', 'go-select',
 'Monitorea múltiples canales de forma simultánea y maneja flujos asíncronos concurrentes usando select.',
 '<h2>Multiplexación con Select</h2><p>La sentencia <code>select</code> permite que una goroutine espere en múltiples operaciones de canal de manera no bloqueante. Se ejecuta el caso del canal que primero tenga datos disponibles para lectura o escritura.</p>',
 4, 30, 80, 'select',
 'La sentencia <code>select</code> bloquea la ejecución del hilo hasta que alguno de sus casos de canal esté listo para operar.',
 'Completa la estructura para monitorear lecturas concurrentes de dos canales.',
 'package main\nimport "fmt"\nfunc main() {\n  ch1 := make(chan string)\n  ch2 := make(chan string)\n  _____ {\n  case msg1 := <-ch1:\n    fmt.Println(msg1)\n  case msg2 := <-ch2:\n    fmt.Println(msg2)\n  }\n}',
 'Multiplexing with Select', 'Listen to multiple concurrent channels simultaneously and structure async flows using select.',
 '<h2>Multiplexing with Select</h2><p>The <code>select</code> statement enables a goroutine to wait on multiple channel events. It selects the first channel that is ready for data exchange.',
 'The <code>select</code> statement blocks execution until at least one of its channel cases is ready to run.',
 'Complete the control structure to monitor concurrent channel reads from two sources.'),

('go-advanced', 'Genéricos (Type Parameters)', 'go-genericos',
 'Escribe código altamente reutilizable y seguro utilizando parámetros de tipo en Go 1.18+.',
 '<h2>Genéricos en Go</h2><p>Introducidos en Go 1.18, los parámetros de tipo (Genéricos) permiten escribir algoritmos independientes del tipo concreto. Se definen entre corchetes usando restricciones como `any` (interfaz vacía) o `comparable`.</p>',
 5, 26, 75, 'any',
 'La restricción predefinida <code>any</code> es un alias de la interfaz vacía y representa cualquier tipo en Go.',
 'Completa la firma de la función genérica "Imprimir" para aceptar cualquier tipo de datos.',
 'package main\nimport "fmt"\nfunc Imprimir[T _____](slice []T) {\n  for _, v := range slice {\n    fmt.Println(v)\n  }\n}',
 'Generics (Type Parameters)', 'Write highly reusable type-safe logic using type parameters introduced in Go 1.18+.',
 '<h2>Generics in Go</h2><p>Added in Go 1.18, Type Parameters (Generics) let you construct functions and types that work with various argument types. Constraints are declared in brackets using built-in interfaces like <code>any</code> or <code>comparable</code>.</p>',
 'The <code>any</code> keyword is a constraint alias for Go\'s empty interface, matching any value type.',
 'Complete the generic function signature for "Imprimir" to accept any slice data type.'),

('go-advanced', 'Gestión del Contexto (Context)', 'go-context',
 'Controla el ciclo de vida de operaciones concurrentes, propagando cancelaciones y tiempos de expiración a través de Context.',
 '<h2>El paquete Context</h2><p>El paquete <code>context</code> permite propagar señales de cancelación, plazos de expiración y valores seguros de API a través de hilos paralelos. Ayuda a evitar fugas de memoria por goroutines colgadas.</p>',
 6, 28, 75, 'WithCancel',
 '<code>WithCancel</code> devuelve una copia del contexto padre con un canal que se cierra al llamar a la función <code>cancel</code>.',
 'Completa la creación del contexto con función de cancelación incorporada.',
 'package main\nimport (\n  "context"\n  "fmt"\n)\nfunc main() {\n  ctx, cancel := context._____(context.Background())\n  defer cancel()\n  fmt.Println(ctx)\n}',
 'Context Management', 'Control the lifecycle of concurrent sub-tasks, propagating cancellations and timeouts using Context.',
 '<h2>Context in Go</h2><p>The <code>context</code> package propagates API values, execution deadlines, and cancellation signals across execution boundaries, preventing orphaned goroutines from leaking memory.',
 '<code>WithCancel</code> wraps a context returning a child context along with a cancel function trigger.',
 'Complete the constructor call to generate a context containing a cancellation trigger.'),

('go-advanced', 'Proyecto Final: Servidor HTTP Concurrente', 'go-proyecto-final',
 'Une todos los conceptos en un servidor web concurrente y seguro que procesa peticiones en tiempo real.',
 '<h2>Proyecto Final: Servidor HTTP Concurrente</h2><p>En el ecosistema de Go, las llamadas HTTP nativas se gestionan eficientemente asignando cada petición a su propia goroutine de forma transparente. Completarás un servidor conectando controladores de ruta (handlers) y configurando el arranque del puerto.</p>',
 7, 35, 90, 'nil',
 'Se pasa <code>nil</code> para utilizar el Multiplexor HTTP por defecto (DefaultServeMux).',
 'Completa el arranque del servidor escuchando en el puerto 8080.',
 'package main\nimport (\n  "fmt"\n  "net/http"\n)\nfunc main() {\n  http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {\n    fmt.Fprintf(w, "OK")\n  })\n  http.ListenAndServe(":8080", _____)\n}',
 'Final Project: Concurrent HTTP Server', 'Unify all concepts into a concurrent, high-performance web server handling client requests in real-time.',
 '<h2>Final Project: Concurrent HTTP Server</h2><p>Go web stacks process requests concurrently by spawning dedicated goroutines for each HTTP connection. You will complete a minimal server setup integrating request handlers and socket listening.</p>',
 'We pass <code>nil</code> to instruct Go to utilize its built-in DefaultServeMux routing multiplexer.',
 'Complete the port listener call to bind and serve on port 8080.');

-- 5. Insert staged records into production tables
INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward
)
SELECT
  lp.id, seed.title, seed.slug, seed.description, seed.content,
  seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM go_curriculum_seed seed
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

-- 6. Insert translations for lessons (English)
INSERT INTO lesson_translations (lesson_id, locale, title, description, content)
SELECT l.id, 'en', seed.title_en, seed.description_en, seed.content_en
FROM go_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  content = VALUES(content);

-- 7. Insert lesson solutions
INSERT INTO lesson_solutions (
  lesson_id, language_id, solution_code, explanation, prompt, base_code
)
SELECT
  l.id, pl.id, seed.solution_code, seed.explanation, seed.prompt, seed.base_code
FROM go_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE
  language_id = VALUES(language_id),
  solution_code = VALUES(solution_code),
  explanation = VALUES(explanation),
  prompt = VALUES(prompt),
  base_code = VALUES(base_code);

-- 8. Insert translations for lesson solutions (English)
INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM go_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
JOIN lesson_solutions ls ON ls.lesson_id = l.id
ON DUPLICATE KEY UPDATE
  explanation = VALUES(explanation),
  prompt = VALUES(prompt);

-- 9. Delete existing test cases for these lessons and recreate standard ones
DELETE ltc
FROM lesson_test_cases ltc
JOIN lessons l ON l.id = ltc.lesson_id
JOIN go_curriculum_seed seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica la variable indicada en el ejercicio.', 0, 10, 1
FROM go_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe ejecutarse sin errores de sintaxis.', 0, 10, 2
FROM go_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Mantiene una salida clara para consola.', 1, 10, 3
FROM go_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE go_curriculum_seed;

COMMIT;
