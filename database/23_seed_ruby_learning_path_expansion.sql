-- CodeQuest Ruby curriculum expansion.
-- Adapted from standard progressive learning pathways and tailored for CodeQuest.
-- No third-party tutorial text is copied.

START TRANSACTION;

-- 1. Insert or update the learning paths for Ruby (programming_language_id = 7)
INSERT INTO learning_paths (
  programming_language_id, name, slug, description, difficulty_level, estimated_hours, is_optional, order_position, is_active
) VALUES 
(7, 'Ruby desde Cero', 'ruby-basics', 'Aprende los fundamentos de Ruby: variables, tipos de datos, control de flujo y bucles.', 'principiante', 40, 0, 1, 1),
(7, 'Ruby Intermedio', 'ruby-intermediate', 'Domina metodos, bloques, POO (clases, herencia), modulos y excepciones en Ruby.', 'intermedio', 50, 0, 2, 1),
(7, 'Ruby Avanzado', 'ruby-advanced', 'Profundiza en metaprogramacion, concurrencia (hilos/Ractors), pattern matching y optimizacion en Ruby.', 'avanzado', 60, 0, 3, 1)
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
SELECT id, 'es', name, description FROM learning_paths WHERE programming_language_id = 7
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT id, 'en',
  CASE slug
    WHEN 'ruby-basics' THEN 'Ruby from Scratch'
    WHEN 'ruby-intermediate' THEN 'Intermediate Ruby'
    WHEN 'ruby-advanced' THEN 'Advanced Ruby'
  END,
  CASE slug
    WHEN 'ruby-basics' THEN 'Learn the fundamentals of Ruby: variables, data types, control flow, and loops.'
    WHEN 'ruby-intermediate' THEN 'Master methods, blocks, OOP (classes, inheritance), modules, and exceptions in Ruby.'
    WHEN 'ruby-advanced' THEN 'Go deep into metaprogramming, concurrency (threads/Ractors), pattern matching, and optimization in Ruby.'
  END
FROM learning_paths
WHERE programming_language_id = 7
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 3. Create temporary table to stage lessons, solutions, prompts, and translations
CREATE TEMPORARY TABLE ruby_curriculum_seed (
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
INSERT INTO ruby_curriculum_seed (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code,
  title_en, description_en, content_en, explanation_en, prompt_en
) VALUES
-- PATH: ruby-basics
('ruby-basics', 'Introducción a Ruby y Salida Estándar', 'ruby-introduccion',
 'Conoce el origen de Ruby, su filosofía y aprende a imprimir texto usando puts y print.',
 '<h2>Introducción a Ruby</h2><p>Ruby es un lenguaje de programación dinámico, reflexivo y orientado a objetos, creado en la década de 1990 por Yukihiro Matsumoto. Su filosofía se centra en la productividad y la felicidad del programador, ofreciendo una sintaxis limpia y natural.</p><h3>Salida de Datos</h3><p>Para mostrar información en pantalla, Ruby ofrece dos métodos principales:</p><ul><li><code>puts</code>: Imprime el valor en la consola y agrega un salto de línea al final.</li><li><code>print</code>: Imprime el valor de manera continua sin salto de línea.</li></ul><pre><code>puts "¡Hola, CodeQuest!"\nprint "Este es un "\nprint "texto continuo."</code></pre><p>Practica completando la salida en consola para mostrar tu primer mensaje en CodeQuest.</p>',
 1, 15, 50, 'puts',
 'El método <code>puts</code> imprime una línea con un salto automático al final.',
 'Completa el método para imprimir el mensaje "Hola" en consola en Ruby.',
 '_____ "Hola"',
 'Introduction to Ruby and Standard Output', 'Discover Ruby\'s origins, philosophy, and learn how to print text using puts and print.',
 '<h2>Introduction to Ruby</h2><p>Ruby is a dynamic, reflective, object-oriented programming language created in the 1990s by Yukihiro Matsumoto. Its philosophy centers on developer happiness and productivity, offering a clean, natural syntax.</p><h3>Printing Data</h3><p>To display information on the screen, Ruby provides two primary methods:</p><ul><li><code>puts</code>: Prints the value to the console and adds a newline at the end.</li><li><code>print</code>: Prints the value continuously without a newline.</li></ul><pre><code>puts "Hello, CodeQuest!"\nprint "This is "\nprint "continuous text."</code></pre><p>Practice by completing the console output to show your first message in CodeQuest.</p>',
 'The <code>puts</code> method prints a line with a newline at the end.',
 'Complete the method to print the message "Hola" to the console in Ruby.'),

('ruby-basics', 'Variables y Constantes', 'ruby-variables-constantes',
 'Aprende los diferentes ámbitos de variables (locales, de instancia, globales) y cómo definir constantes en Ruby.',
 '<h2>Variables y Constantes en Ruby</h2><p>Ruby utiliza convenciones en los nombres de las variables para definir su alcance o ámbito:</p><ul><li><strong>Variables Locales</strong>: Comienzan con minúscula o guion bajo (<code>nombre = "Ruby"</code>). Solo son accesibles en el bloque donde se definen.</li><li><strong>Constantes</strong>: Comienzan con mayúscula (<code>PI = 3.1416</code>). Ruby permite modificarlas pero emitirá una advertencia.</li><li><strong>Variables de Instancia</strong>: Comienzan con un arroba (<code>@nombre</code>), accesibles dentro de objetos.</li><li><strong>Variables Globales</strong>: Comienzan con signo de dólar (<code>$global</code>), accesibles en todo el programa.</li></ul>',
 2, 20, 50, 'desafio',
 'Las variables locales en Ruby deben empezar con una letra minúscula o guion bajo.',
 'Completa la variable para que almacene el nombre "Desafío".',
 '_____ = "Desafío"\nputs desafio',
 'Variables and Constants', 'Learn the different variable scopes (local, instance, global) and how to define constants in Ruby.',
 '<h2>Variables and Constants in Ruby</h2><p>Ruby uses variable naming conventions to define their scope:</p><ul><li><strong>Local Variables</strong>: Start with a lowercase letter or underscore (<code>name = "Ruby"</code>). Only accessible in their current block.</li><li><strong>Constants</strong>: Start with an uppercase letter (<code>PI = 3.1416</code>). Ruby allows modification but emits a warning.</li><li><strong>Instance Variables</strong>: Start with a single at sign (<code>@name</code>), accessible within object instances.</li><li><strong>Global Variables</strong>: Start with a dollar sign (<code>$global</code>), accessible throughout the entire program.</li></ul>',
 'Local variables in Ruby must start with a lowercase letter or an underscore.',
 'Complete the variable to store the name "Desafío".'),

('ruby-basics', 'Tipos de Datos y Literales', 'ruby-literales-datos',
 'Conoce los tipos de datos principales de Ruby: Strings (con interpolación), Numbers, Booleans y Símbolos.',
 '<h2>Tipos de Datos</h2><p>En Ruby, todo es un objeto. Los tipos más usados son:</p><ul><li><strong>Strings</strong>: Cadenas de caracteres. Si usas comillas dobles, puedes hacer interpolación con <code>#{}</code>.</li><li><strong>Numbers</strong>: Enteros y flotantes (<code>5</code>, <code>9.99</code>).</li><li><strong>Symbols</strong>: Identificadores inmutables únicos precedidos por dos puntos (<code>:mi_simbolo</code>). Ahorran memoria porque apuntan al mismo espacio del sistema.</li></ul>',
 3, 20, 50, 'lenguaje',
 'Usamos <code>#{variable}</code> dentro de un string con comillas dobles para evaluar el valor de la variable.',
 'Completa la expresión de interpolación para imprimir "Hola Ruby".',
 'lenguaje = "Ruby"\nputs "Hola #{_____}"',
 'Data Types and Literals', 'Learn Ruby\'s primary data types: Strings (with interpolation), Numbers, Booleans, and Symbols.',
 '<h2>Data Types</h2><p>In Ruby, everything is an object. The most commonly used types are:</p><ul><li><strong>Strings</strong>: Character strings. With double quotes, you can perform interpolation using <code>#{}</code>.</li><li><strong>Numbers</strong>: Integers and floats (<code>5</code>, <code>9.99</code>).</li><li><strong>Symbols</strong>: Unique immutable identifiers prefixed by a colon (<code>:my_symbol</code>). They save memory by sharing instances.</p>',
 'We use <code>#{variable}</code> inside double-quoted strings to evaluate the variable\'s value.',
 'Complete the interpolation expression to print "Hola Ruby".'),

('ruby-basics', 'Operadores y el Operador Spaceship', 'ruby-operadores',
 'Comprende los operadores aritméticos, de comparación y el especial operador spaceship (<=>).',
 '<h2>Operadores en Ruby</h2><p>Ruby soporta los operadores comunes de aritmética (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>%</code>) y asignación.</p><h3>El Operador Spaceship (&lt;=&gt;)</h3><p>Este operador compara dos valores y devuelve:</p><ul><li><code>-1</code> si el primer valor es menor que el segundo.</li><li><code>0</code> si son iguales.</li><li><code>1</code> si el primero es mayor que el segundo.</li></ul><pre><code>5 &lt;=&gt; 10  # Devuelve -1\n10 &lt;=&gt; 5  # Devuelve 1\n5 &lt;=&gt; 5   # Devuelve 0</code></pre>',
 4, 18, 50, '<=>',
 'El operador spaceship <code>&lt;=&gt;</code> realiza tres comparaciones a la vez devolviendo -1, 0 o 1.',
 'Completa el operador spaceship para comparar 10 y 20.',
 'resultado = 10 _____ 20\nputs resultado',
 'Operators and the Spaceship Operator', 'Learn arithmetic, comparison, and the special spaceship operator (<=>).',
 '<h2>Operators in Ruby</h2><p>Ruby supports standard arithmetic (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>%</code>) and assignment operators.</p><h3>The Spaceship Operator (&lt;=&gt;)</h3><p>This operator compares two values and returns:</p><ul><li><code>-1</code> if the first value is less than the second.</li><li><code>0</code> if they are equal.</li><li><code>1</code> if the first value is greater than the second.</li></ul><pre><code>5 &lt;=&gt; 10  # Returns -1\n10 &lt;=&gt; 5  # Returns 1\n5 &lt;=&gt; 5   # Returns 0</code></pre>',
 'The spaceship operator <code>&lt;=&gt;</code> compares two values, returning -1, 0, or 1.',
 'Complete the spaceship operator to compare 10 and 20.'),

('ruby-basics', 'Condicionales: if, unless y case', 'ruby-condicionales',
 'Domina las estructuras de control condicionales, incluyendo if, case, y el operador inverso unless.',
 '<h2>Estructuras de Control Condicionales</h2><p>Ruby introduce condicionales muy legibles:</p><ul><li><strong>if</strong>: Ejecuta el bloque si la condición es verdadera.</li><li><strong>unless</strong>: Lo opuesto a if. Ejecuta el bloque <em>solo si la condición es falsa</em>.</li><li><strong>case/when</strong>: Estructura multiruta para evaluar una expresión contra múltiples condiciones.</li></ul><pre><code>unless activo\n  puts "El sistema está inactivo"\nend</code></pre>',
 5, 22, 50, 'unless',
 '<code>unless</code> es equivalente a "a menos que", ejecutándose cuando la expresión evaluada es falsa.',
 'Completa la estructura para ejecutar el código si el usuario no tiene permisos (es decir, cuando "permitido" sea falso).',
 'permitido = false\n_____ permitido\n  puts "Acceso denegado"\nend',
 'Conditionals: if, unless, and case', 'Master conditional control structures, including if, case, and the inverse unless operator.',
 '<h2>Conditional Control Structures</h2><p>Ruby introduces highly readable conditional options:</p><ul><li><strong>if</strong>: Runs the block if the condition evaluates to true.</li><li><strong>unless</strong>: The inverse of if. Runs the block <em>only if the condition is false</em>.</li><li><strong>case/when</strong>: Multiway branch evaluated against multiple match conditions.</li></ul><pre><code>unless active\n  puts "System is inactive"\nend</code></pre>',
 '<code>unless</code> is equivalent to "if not", running only when the condition is false.',
 'Complete the block to execute when "permitido" is false.'),

('ruby-basics', 'Bucles y Métodos Iteradores', 'ruby-bucles',
 'Aprende a utilizar while, until y los iteradores de rango o cantidad como times y upto.',
 '<h2>Bucles en Ruby</h2><p>Además de <code>while</code>, Ruby cuenta con <code>until</code> (ejecuta hasta que la condición sea verdadera) e iteradores de objetos numéricos:</p><ul><li><code>times</code>: Ejecuta un bloque un número determinado de veces.</li><li><code>upto(limite)</code>: Recorre desde el número base hasta el límite.</li></ul><pre><code>5.times do |i|\n  puts "Iteración #{i}"\nend</code></pre>',
 6, 20, 50, 'times',
 'El método <code>times</code> es un iterador entero muy limpio para repetir ejecuciones.',
 'Completa el código para repetir el bloque de código 3 veces.',
 '3._____ do\n  puts "Mensaje repetido"\nend',
 'Loops and Iterators', 'Learn how to use while, until, and numeric block iterators like times and upto.',
 '<h2>Loops in Ruby</h2><p>Along with <code>while</code>, Ruby offers <code>until</code> (runs until the condition is true) and numeric iterators:</p><ul><li><code>times</code>: Runs a block a set number of times.</li><li><code>upto(limit)</code>: Loops from the base number up to the limit.</li></ul><pre><code>5.times do |i|\n  puts "Iteration #{i}"\nend</code></pre>',
 'The <code>times</code> method is an integer iterator used to repeat a block of code.',
 'Complete the code to repeat the block 3 times.'),

-- PATH: ruby-intermediate
('ruby-intermediate', 'Colecciones: Arrays y Hashes', 'ruby-colecciones-basicas',
 'Aprende a estructurar colecciones ordenadas y diccionarios clave-valor usando la sintaxis moderna.',
 '<h2>Colecciones en Ruby</h2><p>Las colecciones clave en Ruby son los Arrays y los Hashes:</p><ul><li><strong>Arrays</strong>: Listas ordenadas de objetos (<code>[1, "dos", :tres]</code>).</li><li><strong>Hashes</strong>: Colecciones asociativas clave-valor. La sintaxis moderna usa símbolos (<code>{ nombre: "Ruby", version: 3.2 }</code>).</li></ul>',
 1, 22, 60, ':idioma',
 'Para recuperar un valor de un hash configurado con la sintaxis de símbolos, debemos usar la clave del símbolo correspondiente (<code>:idioma</code>).',
 'Completa el código para acceder a la clave :idioma en el hash.',
 'curso = { idioma: "Ruby", duracion: 10 }\nputs curso[_____]',
 'Collections: Arrays and Hashes', 'Learn how to structure ordered lists and key-value pairs using modern Ruby hash syntax.',
 '<h2>Collections in Ruby</h2><p>The primary collection types in Ruby are Arrays and Hashes:</p><ul><li><strong>Arrays</strong>: Ordered lists of objects (<code>[1, "two", :three]</code>).</li><li><strong>Hashes</strong>: Key-value associative structures. Modern syntax uses symbols (<code>{ name: "Ruby", version: 3.2 }</code>).</li></ul>',
 'To retrieve a value from a hash defined with symbols, use the correct symbol key (<code>:idioma</code>).',
 'Complete the code to access the key :idioma in the hash.'),

('ruby-intermediate', 'Métodos y Parámetros', 'ruby-metodos',
 'Aprende a encapsular lógica en métodos con retorno implícito y argumentos nombrados.',
 '<h2>Métodos en Ruby</h2><p>Los métodos se definen con <code>def</code> y terminan con <code>end</code>. Una característica fundamental es el <strong>retorno implícito</strong>: Ruby siempre devuelve el resultado de la última línea ejecutada en el método, por lo que la palabra clave <code>return</code> es opcional.</p><pre><code>def duplicar(x)\n  x * 2 # Devuelve x * 2 implícitamente\nend</code></pre>',
 2, 20, 60, 'end',
 'Todos los métodos en Ruby se abren con <code>def</code> y deben cerrarse con la palabra clave <code>end</code>.',
 'Define el método para duplicar el valor sin usar return de forma explícita.',
 'def duplicar(numero)\n  numero * 2\n_____',
 'Methods and Parameters', 'Learn how to encapsulate logic in methods with implicit returns and keyword arguments.',
 '<h2>Methods in Ruby</h2><p>Methods are defined with <code>def</code> and close with <code>end</code>. A key concept is <strong>implicit return</strong>: Ruby always returns the value of the last evaluated expression in the method, making the <code>return</code> keyword optional.</p><pre><code>def double(x)\n  x * 2 # Returns x * 2 implicitly\nend</code></pre>',
 'Methods in Ruby are declared using <code>def</code> and must be closed with the <code>end</code> keyword.',
 'Complete the method definition to return the doubled value.'),

('ruby-intermediate', 'Bloques, Procs y Lambdas', 'ruby-bloques-procs-lambdas',
 'Comprende las clausuras en Ruby, cómo yield ejecuta bloques y las diferencias entre Proc y Lambda.',
 '<h2>Bloques, Procs y Lambdas</h2><p>Ruby soporta programación funcional mediante clausuras:</p><ul><li><strong>Bloques</strong>: Fragmentos de código anónimos delimitados por <code>do/end</code> o <code>{}</code>. Se ejecutan dentro de un método usando <code>yield</code>.</li><li><strong>Procs</strong>: Bloques guardados en variables para reutilización (<code>mi_proc = Proc.new { puts "Hola" }</code>).</li><li><strong>Lambdas</strong>: Variaciones de Proc que validan el número exacto de argumentos y manejan el <code>return</code> volviendo al método llamador (<code>mi_lambda = -&gt;(x) { x * 2 }</code>).</li></ul>',
 3, 28, 65, 'yield',
 'La palabra clave <code>yield</code> suspende temporalmente el método y ejecuta el bloque de código provisto.',
 'Completa el método para que ejecute el bloque de código que se le pase.',
 'def ejecutar_tarea\n  puts "Iniciando..."\n  _____\n  puts "Finalizado."\nend\nejecutar_tarea { puts "Procesando datos" }',
 'Blocks, Procs, and Lambdas', 'Understand closures in Ruby, how yield runs blocks, and the differences between Procs and Lambdas.',
 '<h2>Blocks, Procs, and Lambdas</h2><p>Ruby supports functional programming patterns using closures:</p><ul><li><strong>Blocks</strong>: Anonymous chunks of code wrapped in <code>do/end</code> or <code>{}</code>. Run inside a method using <code>yield</code>.</li><li><strong>Procs</strong>: Blocks saved as variables for reuse (<code>my_proc = Proc.new { puts "Hi" }</code>).</li><li><strong>Lambdas</strong>: Strict versions of Procs that enforce parameter counts and handle <code>return</code> by returning control back to the caller (<code>my_lambda = -&gt;(x) { x * 2 }</code>).</li></ul>',
 'The <code>yield</code> keyword pauses method execution to run the provided block of code.',
 'Complete the method to execute the passed block.'),

('ruby-intermediate', 'Clases y Atributos', 'ruby-clases-objetos',
 'Crea clases con constructor initialize y utiliza attr_accessor para evitar escribir getters y setters manuales.',
 '<h2>Clases en Ruby</h2><p>Ruby es puramente orientado a objetos. Una clase define un plano de construcción. El constructor se llama obligatoriamente <code>initialize</code>.</p><h3>Getters y Setters con attr_</h3><p>En lugar de escribir métodos manuales para leer y escribir variables de instancia, Ruby provee helpers:</p><ul><li><code>attr_reader</code>: Solo lectura (getter).</li><li><code>attr_writer</code>: Solo escritura (setter).</li><li><code>attr_accessor</code>: Lectura y escritura (getter y setter).</li></ul><pre><code>class Robot\n  attr_accessor :nombre\nend</code></pre>',
 4, 25, 60, 'attr_accessor',
 '<code>attr_accessor</code> define de forma dinámica los métodos lectores y escritores para una variable de instancia.',
 'Completa la clase para otorgarle capacidades de lectura y escritura al atributo :nombre.',
 'class Persona\n  _____ :nombre\n  \n  def initialize(nombre)\n    @nombre = nombre\n  end\nend',
 'Classes and Attributes', 'Create classes with an initialize constructor and use attr_accessor to write clean getters and setters.',
 '<h2>Classes in Ruby</h2><p>Ruby is purely object-oriented. A class acts as a blueprint. The constructor is always named <code>initialize</code>.</p><h3>Getters and Setters with attr_</h3><p>Instead of writing getter and setter methods manually, Ruby offers shortcut macros:</p><ul><li><code>attr_reader</code>: Read-only access (getter).</li><li><code>attr_writer</code>: Write-only access (setter).</li><li><code>attr_accessor</code>: Read and write access (both).</li></ul><pre><code>class Robot\n  attr_accessor :name\nend</code></pre>',
 '<code>attr_accessor</code> dynamically creates getter and setter methods for the specified instance variable.',
 'Complete the class definition to allow read and write access to the :nombre attribute.'),

('ruby-intermediate', 'Herencia y Super', 'ruby-herencia',
 'Implementa herencia simple con el operador < e invoca métodos base usando super.',
 '<h2>Herencia en Ruby</h2><p>Ruby soporta <strong>herencia simple</strong>. Una subclase hereda comportamiento de una superclase usando el operador menor que (<code>&lt;</code>).</p><h3>La palabra clave super</h3><p>Cuando reescribes un método en la clase hija, puedes usar <code>super</code> para ejecutar la implementación del mismo método de la clase padre, pasándole los argumentos opcionales.</p><pre><code>class Perro &lt; Animal\n  def hacer_sonido\n    super # Llama al método de Animal\n    puts "Guau!"\n  end\nend</code></pre>',
 5, 24, 60, '<',
 'Se utiliza el carácter menor que <code>&lt;</code> para declarar que una clase hereda de otra.',
 'Completa el código para heredar la clase Desarrollador a partir de la clase Empleado.',
 'class Empleado\nend\nclass Desarrollador _____ Empleado\nend',
 'Inheritance and Super', 'Implement single inheritance using the < operator and call base class methods with super.',
 '<h2>Inheritance in Ruby</h2><p>Ruby supports <strong>single inheritance</strong>. A subclass inherits behavior from a parent class using the less-than operator (<code>&lt;</code>).</p><h3>The super Keyword</h3><p>When overriding a parent method, calling <code>super</code> executes the parent\'s version of the method, optionally passing arguments along.</p><pre><code>class Dog &lt; Animal\n  def make_sound\n    super # Calls Animal\'s make_sound\n    puts "Woof!"\n  end\nend</code></pre>',
 'The less-than character <code>&lt;</code> is used to establish inheritance in Ruby.',
 'Complete the code to make class Desarrollador inherit from Empleado.'),

('ruby-intermediate', 'Módulos y Mixins', 'ruby-modulos-mixins',
 'Utiliza módulos para estructurar namespaces y reutilizar código a través de Mixins con include y extend.',
 '<h2>Módulos y Mixins</h2><p>Dado que Ruby no tiene herencia múltiple, se emplean los <strong>Módulos</strong> (<code>module</code>):</p><ul><li><strong>Namespaces</strong>: Agrupan clases y métodos para evitar colisiones de nombres.</li><li><strong>Mixins</strong>: Copian métodos de un módulo en una clase:<ul><li><code>include</code>: Los métodos se vuelven de <em>instancia</em>.</li><li><code>extend</code>: Los métodos se vuelven de <em>clase</em>.</li></ul></li></ul>',
 6, 25, 60, 'include',
 'El helper <code>include</code> asocia los métodos del módulo como métodos de instancia de la clase.',
 'Agrega el módulo Volador a la clase Ave para que sus instancias puedan usar el método volar.',
 'module Volador\n  def volar; "Volando!"; end\nend\nclass Ave\n  _____ Volador\nend',
 'Modules and Mixins', 'Use modules to build namespaces and share code across classes using include and extend.',
 '<h2>Modules and Mixins</h2><p>Since Ruby does not support multiple inheritance, it uses <strong>Modules</strong> (<code>module</code>):</p><ul><li><strong>Namespaces</strong>: Group classes and methods to prevent naming collisions.</li><li><strong>Mixins</strong>: Include module methods into class structures:<ul><li><code>include</code>: Imports methods as <em>instance</em> methods.</li><li><code>extend</code>: Imports methods as <em>class</em> methods.</li></ul></li></ul>',
 'Use <code>include</code> to mix module methods into class instances.',
 'Add module Volador to class Ave so instances can use the volar method.'),

('ruby-intermediate', 'Manejo de Excepciones', 'ruby-excepciones',
 'Protege tus scripts contra fallos inesperados utilizando begin, rescue, raise y ensure.',
 '<h2>Manejo de Errores</h2><p>El manejo de excepciones en Ruby se realiza con un bloque estructurado:</p><ul><li><code>begin</code>: Bloque donde puede ocurrir un error.</li><li><code>rescue</code>: Atrapa el error para recuperarse.</li><li><code>raise</code>: Fuerza o lanza una excepción (ej. <code>raise ArgumentError, "Inválido"</code>).</li><li><code>ensure</code>: Código que se ejecuta siempre, haya error o no.</li></ul>',
 7, 26, 65, 'rescue',
 '<code>rescue</code> inicia la sección de captura del error del tipo indicado.',
 'Completa el bloque de manejo de errores para capturar la división por cero.',
 'begin\n  resultado = 10 / 0\n_____ ZeroDivisionError\n  puts "No se puede dividir por cero"\nend',
 'Exception Handling', 'Secure your scripts against runtime errors using begin, rescue, raise, and ensure.',
 '<h2>Error Handling</h2><p>Exception handling in Ruby uses a structured block:</p><ul><li><code>begin</code>: Block where exceptions might be thrown.</li><li><code>rescue</code>: Intercepts and recovers from the exception.</li><li><code>raise</code>: Intentionally raises an error (e.g. <code>raise ArgumentError, "Invalid"</code>).</li><li><code>ensure</code>: Code block that runs regardless of errors.</li></ul>',
 '<code>rescue</code> marks the block of code designed to handle exceptions.',
 'Complete the error handling block to catch the division by zero error.'),

-- PATH: ruby-advanced
('ruby-advanced', 'Metaprogramación y Reflexión', 'ruby-metaprogramacion',
 'Escribe código que escribe código usando send, define_method y captura llamadas dinámicas con method_missing.',
 '<h2>Metaprogramación en Ruby</h2><p>Ruby permite inspeccionar y modificar su propia estructura en tiempo de ejecución:</p><ul><li><code>send</code>: Invoca dinámicamente un método pasando su nombre como símbolo o string (<code>objeto.send(:mi_metodo)</code>).</li><li><code>define_method</code>: Define un método dinámicamente en tiempo de ejecución.</li><li><code>method_missing</code>: Callback que se ejecuta cuando se llama a un método inexistente en un objeto.</li></ul>',
 1, 30, 80, 'define_method',
 '<code>define_method</code> es un método privado de clase utilizado para crear un método dinámico a partir de un bloque.',
 'Define dinámicamente un método llamado "procesar" usando metaprogramación.',
 'class Administrador\n  _____(:procesar) do\n    puts "Procesado!"\n  end\nend',
 'Metaprogramming and Reflection', 'Write code that writes code dynamically using send, define_method, and handling missing methods.',
 '<h2>Metaprogramming in Ruby</h2><p>Ruby allows inspecting and modifying program structure at runtime:</p><ul><li><code>send</code>: Dynamically calls a method by name using a symbol or string (<code>object.send(:my_method)</code>).</li><li><code>define_method</code>: Generates a method dynamically at runtime.</li><li><code>method_missing</code>: Intercepts messages sent to objects that don\'t have matching methods defined.</li></ul>',
 '<code>define_method</code> is a class-level macro used to generate dynamic methods.',
 'Dynamically define a method called "procesar" using metaprogramming.'),

('ruby-advanced', 'Concurrencia Clásica: Threads y Fibers', 'ruby-concurrencia',
 'Aprende los modelos de ejecución concurrente clásicos basados en hilos y fibras cooperativas en Ruby.',
 '<h2>Concurrencia Clásica</h2><p>Ruby provee diferentes abstracciones para ejecutar tareas simultáneas:</p><ul><li><strong>Threads (Hilos)</strong>: Múltiples flujos gestionados por el sistema operativo dentro del mismo proceso. Están limitados por el GVL (Global VM Lock) de MRI para paralelismo de CPU, pero son ideales para tareas bloqueantes de E/S.</li><li><strong>Fibers (Fibras)</strong>: Hilos cooperativos ultraligeros. El control de ejecución se cede manualmente entre fibras mediante <code>Fiber.yield</code> y <code>resume</code>.</li></ul>',
 2, 28, 75, 'Thread.new',
 '<code>Thread.new</code> crea e inicia un nuevo hilo de ejecución ligero en el sistema.',
 'Crea y ejecuta un hilo para correr una tarea en segundo plano.',
 'hilo = _____ do\n  puts "Hola desde el hilo"\nend\nhilo.join',
 'Classic Concurrency: Threads and Fibers', 'Learn traditional concurrent execution models using OS threads and lightweight cooperative fibers.',
 '<h2>Classic Concurrency</h2><p>Ruby provides abstractions to run tasks concurrently:</p><ul><li><strong>Threads</strong>: Concurrent OS execution streams. Limited by the GVL (Global VM Lock) in MRI for pure CPU tasks, but great for I/O bound operations.</li><li><strong>Fibers</strong>: Lightweight cooperative execution structures. Control is manually passed between them using <code>Fiber.yield</code> and <code>resume</code>.</li></ul>',
 '<code>Thread.new</code> instantiates and schedules a concurrent execution thread.',
 'Create and run a thread to perform a background task.'),

('ruby-advanced', 'Concurrencia Moderna: Ractor y Paralelismo Real', 'ruby-concurrencia-moderna',
 'Conoce Ractor en Ruby 3, el modelo basado en actores que permite paralelismo real sin compartir estado.',
 '<h2>Concurrencia Moderna: Ractor</h2><p>Introducido en <strong>Ruby 3</strong>, <strong>Ractor</strong> (Ruby Actor) permite la ejecución en paralelo de código sin GIL/GVL. A diferencia de los Threads, los Ractors no comparten la mayoría de objetos entre sí, evitando condiciones de carrera de forma nativa.</p><p>La comunicación se realiza mediante paso de mensajes seguros usando métodos de envío y recepción.</p><pre><code>r = Ractor.new { Ractor.receive * 2 }\nr.send(21)\nputs r.take # Devuelve 42</code></pre>',
 3, 30, 80, 'Ractor',
 '<code>Ractor</code> es el componente oficial introducido en Ruby 3 para lograr ejecución paralela y segura de hilos múltiples.',
 'Completa la creación del Ractor para habilitar ejecución paralela segura.',
 'r = _____.new { "Hola de Ractor" }\nputs r.take',
 'Modern Concurrency: Ractor and Fiber Scheduler', 'Learn about Ruby 3+ Ractor model, enabling true parallelism through shared-nothing actors.',
 '<h2>Modern Concurrency: Ractor</h2><p>Introduced in <strong>Ruby 3</strong>, <strong>Ractor</strong> (Ruby Actor) allows parallel CPU execution by bypassing the GVL/GIL. Unlike Threads, Ractors do not share mutable objects by default, naturally avoiding race conditions.</p><p>Communication is handled via safe message passing.</p><pre><code>r = Ractor.new { Ractor.receive * 2 }\nr.send(21)\nputs r.take # Returns 42</code></pre>',
 '<code>Ractor</code> is the actor-based model introduced in Ruby 3 for safe multi-core execution.',
 'Complete the Ractor constructor call to enable safe parallel execution.'),

('ruby-advanced', 'Pattern Matching', 'ruby-pattern-matching',
 'Utiliza case/in para estructurar y deconstruir estructuras complejas de datos (Arrays y Hashes) de manera limpia.',
 '<h2>Pattern Matching en Ruby</h2><p>Introducido en Ruby 2.7 y consolidado en Ruby 3, el <strong>Pattern Matching</strong> permite deconstruir colecciones complejas usando la palabra clave <code>in</code> dentro de un bloque <code>case</code>.</p><pre><code>case [1, 2, 3]\nin [1, a, b]\n  puts "Match! a=#{a}, b=#{b}"\nend</code></pre>',
 4, 25, 75, 'in',
 'En pattern matching de Ruby, se utiliza la palabra clave <code>in</code> seguida del patrón a validar y deconstruir.',
 'Completa la sintaxis pattern matching para buscar coincidencia en el array de datos.',
 'coordenadas = [0, 10]\ncase coordenadas\n_____ [0, y]\n  puts "Origen detectado. y = #{y}"\nend',
 'Pattern Matching', 'Use case/in to structure and deconstruct complex objects, hashes, and arrays cleanly.',
 '<h2>Pattern Matching in Ruby</h2><p>Introduced in Ruby 2.7 and standardized in Ruby 3, <strong>Pattern Matching</strong> allows structural validation and deconstruction using the <code>in</code> keyword inside a <code>case</code> expression.</p><pre><code>case [1, 2, 3]\nin [1, a, b]\n  puts "Matched! a=#{a}, b=#{b}"\nend</code></pre>',
 'In Ruby pattern matching, the <code>in</code> keyword specifies the matching structure pattern.',
 'Complete the pattern matching syntax to match the coordinates array.'),

('ruby-advanced', 'Optimización de Memoria', 'ruby-gestion-memoria',
 'Mejora el rendimiento de tus programas usando la directiva frozen_string_literal e inmutabilidad.',
 '<h2>Gestión y Optimización</h2><p>Para evitar asignaciones excesivas de memoria (Garbage Collection overhead) en Ruby, se recomiendan ciertas prácticas:</p><ul><li><strong>frozen_string_literal: true</strong>: Directiva mágica colocada al inicio del archivo. Hace que todos los strings literales sean inmutables (congelados), reduciendo asignaciones repetidas de objetos idénticos.</li><li><strong>Inmutabilidad</strong>: Congelar objetos creados dinámicamente usando <code>.freeze</code>.</li></ul><pre><code># frozen_string_literal: true\nstr1 = "hola"\nstr2 = "hola" # Apuntan al mismo ID en memoria</code></pre>',
 5, 20, 75, 'true',
 'Establecer la directiva en <code>true</code> congela todos los literales de texto dentro de dicho archivo.',
 'Completa la directiva mágica al inicio del archivo para congelar strings automáticamente.',
 '# frozen_string_literal: _____\nstr = "Cadena inmutable"',
 'Memory Management and Optimization', 'Boost script performance using the frozen_string_literal magic comment and frozen objects.',
 '<h2>Memory and GC Optimization</h2><p>To reduce object allocations and ease garbage collection workload in Ruby, use the following patterns:</p><ul><li><strong>frozen_string_literal: true</strong>: A special compiler comment placed at the top of files that makes all literal strings frozen and shared across memory locations.</li><li><strong>Immutability</strong>: Protect objects from mutation and GC pressure by applying <code>.freeze</code>.</li></ul><pre><code># frozen_string_literal: true\nstr1 = "hello"\nstr2 = "hello" # Point to the same memory allocation</code></pre>',
 'Setting this comment directive to <code>true</code> freezes all string literals in the file scope.',
 'Complete the magic file comment to freeze string literals by default.'),

('ruby-advanced', 'Pruebas Automatizadas con RSpec', 'ruby-pruebas-rspec',
 'Aprende la metodología de pruebas con el framework BDD RSpec para asegurar la calidad de tu código.',
 '<h2>Pruebas Automatizadas</h2><p>La suite de pruebas BDD preferida en la comunidad Ruby es <strong>RSpec</strong>. Se organiza en bloques descriptivos:</p><ul><li><code>describe</code>: Agrupa un conjunto de pruebas relacionadas.</li><li><code>it</code>: Define un caso de prueba individual.</li><li><code>expect(...).to eq(...)</code>: Verifica que la condición devuelta es la esperada.</li></ul>',
 6, 28, 75, 'to',
 'RSpec utiliza la estructura <code>expect(valor).to eq(esperado)</code> para realizar aserciones afirmativas.',
 'Completa la aserción de RSpec para validar que el resultado es 4.',
 'describe "Calculadora" do\n  it "suma correctamente" do\n    expect(2 + 2)._____ eq(4)\n  end\nend',
 'Testing with RSpec', 'Learn modern test-driven development methodologies using the RSpec BDD testing library.',
 '<h2>Automated Testing</h2><p>The standard BDD testing framework in the Ruby community is <strong>RSpec</strong>. It organizes test suites in expressive blocks:</p><ul><li><code>describe</code>: Groups related test cases.</li><li><code>it</code>: Defines an individual test case.</li><li><code>expect(...).to eq(...)</code>: Asset that output matches expectation.</li></ul>',
 'RSpec matches values using the <code>expect(value).to eq(expected)</code> syntax.',
 'Complete the RSpec assertion to verify that 2 + 2 equals 4.'),

('ruby-advanced', 'Proyecto Final: Procesador de Logs', 'ruby-proyecto-final',
 'Integra clases, iteradores, excepciones y colecciones en un script que analiza y limpia registros estructurados.',
 '<h2>Proyecto Final: Procesador de Logs</h2><p>Este proyecto final integra las principales herramientas de Ruby en un único programa sólido. Desarrollarás un analizador que lee líneas de log estructuradas, extrae errores, procesa valores de forma segura manejando posibles excepciones, y presenta un resumen final estructurado.</p><p>La combinación de bloques iterativos, clases limpias y aserciones de excepciones representa un flujo completo del mundo real.</p>',
 7, 35, 90, 'select',
 'El método <code>select</code> (o <code>filter</code>) de los objetos enumerables filtra y devuelve todos los elementos para los cuales el bloque de código es verdadero.',
 'Completa el filtro para seleccionar únicamente aquellos logs que tienen el estado de "ERROR".',
 'logs = [{tipo: "INFO", msg: "OK"}, {tipo: "ERROR", msg: "Fallo"}]\nerrores = logs._____ { |log| log[:tipo] == "ERROR" }\nputs errores.length',
 'Final Project: Log Processor', 'Combine classes, iterators, exceptions, and collections to construct a robust log analytics script.',
 '<h2>Final Project: Log Processor</h2><p>This final project brings together Ruby\'s core tools into a single robust application. You will build a log parser that reads structured logs, extracts errors, processes them safely under exception handling, and yields a summary output.</p><p>Combining collections, enumerator blocks, and classes reflects real-world program flow.</p>',
 'The <code>select</code> method filters elements of an enumerable collection returning those satisfying the block.',
 'Complete the filter expression to select only logs of type "ERROR".');

-- 5. Insert staged records into production tables
INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward
)
SELECT
  lp.id, seed.title, seed.slug, seed.description, seed.content,
  seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM ruby_curriculum_seed seed
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
FROM ruby_curriculum_seed seed
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
FROM ruby_curriculum_seed seed
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
FROM ruby_curriculum_seed seed
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
JOIN ruby_curriculum_seed seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica la variable indicada en el ejercicio.', 0, 10, 1
FROM ruby_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe ejecutarse sin errores de sintaxis.', 0, 10, 2
FROM ruby_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Mantiene una salida clara para consola.', 1, 10, 3
FROM ruby_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE ruby_curriculum_seed;

COMMIT;
