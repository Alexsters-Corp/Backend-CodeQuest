-- Seed minimo e idempotente de lecciones publicadas para entorno local.
-- Objetivo: garantizar flujo funcional de onboarding -> modulos -> leccion.

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_free_demo, xp_reward
)
SELECT
  1,
  'Introduccion a Python',
  'python-introduccion',
  'Variables, tipos de datos y ejecucion de tu primer script en Python.',
  '<h2>Introduccion a Python</h2>
<p>Python es uno de los lenguajes mas populares del mundo gracias a su legibilidad y versatilidad. Se usa en desarrollo web, ciencia de datos, automatizacion e inteligencia artificial.</p>
<h3>Variables y tipos basicos</h3>
<p>En Python no necesitas declarar el tipo de una variable. El interprete lo infiere automaticamente:</p>
<pre><code>nombre = "CodeQuest"   # str
edad   = 25            # int
precio = 9.99          # float
activo = True          # bool</code></pre>
<h3>Salida por consola</h3>
<p>La funcion <code>print()</code> muestra valores en la consola. Puedes pasarle cualquier variable o expresion:</p>
<pre><code>print(nombre)          # CodeQuest
print(edad + 5)        # 30
print(f"Hola, {nombre}!")  # Hola, CodeQuest!</code></pre>
<h3>Listas y transformaciones</h3>
<p>Las listas almacenan colecciones ordenadas. La comprension de listas permite transformarlas en una sola linea:</p>
<pre><code>numeros = [1, 2, 3]
dobles  = [n * 2 for n in numeros]
print(dobles)  # [2, 4, 6]</code></pre>
<p>Practica identificar el nombre de la variable que contiene el resultado de una transformacion.</p>',
  1, 20, 1, 0, 50
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 1 AND slug = 'python-introduccion'
);

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_free_demo, xp_reward
)
SELECT
  2,
  'Colecciones y funciones en Python',
  'python-colecciones-funciones',
  'Listas, diccionarios, funciones y reutilizacion de logica en Python.',
  '<h2>Colecciones y funciones en Python</h2>
<p>Organizar datos y encapsular logica son dos habilidades fundamentales. Python ofrece estructuras de datos potentes y funciones de primera clase para lograrlo.</p>
<h3>Listas</h3>
<p>Las listas son mutables y admiten elementos de cualquier tipo. Los metodos mas usados son <code>append()</code>, <code>pop()</code> y <code>sort()</code>:</p>
<pre><code>frutas = ["manzana", "pera", "uva"]
frutas.append("mango")
print(frutas)  # ["manzana", "pera", "uva", "mango"]</code></pre>
<h3>Diccionarios</h3>
<p>Los diccionarios almacenan pares clave-valor y son ideales para representar objetos:</p>
<pre><code>usuario = {"nombre": "Ana", "edad": 28}
print(usuario["nombre"])  # Ana</code></pre>
<h3>Funciones</h3>
<p>Una funcion agrupa logica reutilizable. Se define con <code>def</code> y puede retornar un valor:</p>
<pre><code>def calcular_dobles(numeros):
    return [n * 2 for n in numeros]

resultado = calcular_dobles([1, 2, 3])
print(resultado)  # [2, 4, 6]</code></pre>
<p>Observa que el valor de retorno se guarda en la variable <code>resultado</code>. Identificar correctamente esa variable es clave para trabajar con funciones.</p>',
  1, 25, 1, 0, 60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 2 AND slug = 'python-colecciones-funciones'
);

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_free_demo, xp_reward
)
SELECT
  3,
  'Fundamentos de JavaScript',
  'js-fundamentos',
  'Tipos de datos, funciones y manipulacion basica en JavaScript moderno.',
  '<h2>Fundamentos de JavaScript</h2>
<p>JavaScript es el lenguaje del navegador y tambien del servidor gracias a Node.js. Dominar sus bases te permitira construir desde scripts sencillos hasta aplicaciones completas.</p>
<h3>Variables: let y const</h3>
<p>Usa <code>const</code> para valores que no cambian y <code>let</code> para los que si:</p>
<pre><code>const PI = 3.14159
let contador = 0
contador += 1
console.log(contador)  // 1</code></pre>
<h3>Arrays y metodos funcionales</h3>
<p>Los arrays en JS tienen metodos poderosos como <code>map()</code>, <code>filter()</code> y <code>reduce()</code>:</p>
<pre><code>const numeros = [1, 2, 3]
const dobles  = numeros.map((n) => n * 2)
console.log(dobles)  // [2, 4, 6]</code></pre>
<h3>Funciones flecha</h3>
<p>Las funciones flecha son una sintaxis compacta para definir funciones:</p>
<pre><code>const saludar = (nombre) => `Hola, ${nombre}!`
console.log(saludar("CodeQuest"))  // Hola, CodeQuest!</code></pre>
<p>Practica reconocer la variable que almacena el array transformado despues de aplicar <code>map()</code>.</p>',
  1, 20, 1, 0, 50
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 3 AND slug = 'js-fundamentos'
);

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_free_demo, xp_reward
)
SELECT
  4,
  'Asincronia en JavaScript',
  'js-asincronia',
  'Promises, async/await y manejo de errores en operaciones asincronas.',
  '<h2>Asincronia en JavaScript</h2>
<p>JavaScript es single-threaded, por lo que delega las operaciones lentas (red, disco, timers) al entorno de ejecucion. La asincronia permite que el programa siga respondiendo mientras espera.</p>
<h3>Promises</h3>
<p>Una Promise representa un valor que estara disponible en el futuro. Tiene tres estados: pending, fulfilled y rejected:</p>
<pre><code>const promesa = new Promise((resolve, reject) => {
  setTimeout(() => resolve("datos listos"), 1000)
})
promesa.then((datos) => console.log(datos))</code></pre>
<h3>async / await</h3>
<p><code>async/await</code> es azucar sintatico sobre Promises que hace el codigo asincrono tan legible como el sincrono:</p>
<pre><code>async function obtenerDatos() {
  const datos = await fetch("https://api.ejemplo.com/items")
  return datos.json()
}
const dobles = [2, 4, 6]
console.log(dobles)</code></pre>
<h3>Manejo de errores</h3>
<p>Envuelve las llamadas asincronas en <code>try/catch</code> para capturar fallos de forma controlada:</p>
<pre><code>async function cargar() {
  try {
    const resultado = await obtenerDatos()
    console.log(resultado)
  } catch (error) {
    console.error("Error:", error.message)
  }
}</code></pre>
<p>Dominar async/await es esencial para cualquier aplicacion moderna que consuma APIs o bases de datos.</p>',
  1, 30, 1, 0, 70
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 4 AND slug = 'js-asincronia'
);

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_free_demo, xp_reward
)
SELECT
  5,
  'Java: clases y objetos',
  'java-clases-objetos',
  'Programacion orientada a objetos con Java: clases, atributos y metodos.',
  '<h2>Clases y objetos en Java</h2>
<p>Java es un lenguaje orientado a objetos por diseno. Todo el codigo reside dentro de clases, y los objetos son instancias de esas clases.</p>
<h3>Definir una clase</h3>
<p>Una clase agrupa atributos (datos) y metodos (comportamiento):</p>
<pre><code>public class Persona {
    private String nombre;
    private int edad;

    public Persona(String nombre, int edad) {
        this.nombre = nombre;
        this.edad   = edad;
    }

    public String getNombre() { return this.nombre; }
}</code></pre>
<h3>Crear un objeto</h3>
<p>Usas <code>new</code> para instanciar una clase y el constructor se ejecuta automaticamente:</p>
<pre><code>Persona p = new Persona("Ana", 28);
System.out.println(p.getNombre());  // Ana</code></pre>
<h3>Imprimiendo variables</h3>
<p>El metodo <code>System.out.println()</code> acepta cualquier tipo de dato. Al pasarle una variable de tipo String, muestra su contenido:</p>
<pre><code>String mensaje = "Hola CodeQuest";
System.out.println(mensaje);  // Hola CodeQuest</code></pre>
<p>Identificar correctamente la variable que contiene el valor a imprimir es la base de la depuracion en Java.</p>',
  1, 25, 1, 0, 60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 5 AND slug = 'java-clases-objetos'
);

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_free_demo, xp_reward
)
SELECT
  6,
  'C++: sintaxis esencial',
  'cpp-sintaxis-esencial',
  'Variables, control de flujo, funciones y entrada/salida en C++.',
  '<h2>Sintaxis esencial en C++</h2>
<p>C++ combina la potencia de C con abstracciones de alto nivel. Es el lenguaje detras de motores de videojuegos, sistemas operativos y software de alto rendimiento.</p>
<h3>Variables y tipos</h3>
<p>En C++ debes declarar el tipo de cada variable. Los tipos basicos son <code>int</code>, <code>double</code>, <code>char</code> y <code>bool</code>:</p>
<pre><code>int total = 2 + 3;
double precio = 19.99;
bool activo = true;</code></pre>
<h3>Salida con cout</h3>
<p>El operador <code><<</code> encadena valores hacia la salida estandar:</p>
<pre><code>std::cout << total << std::endl;   // 5
std::cout << "Precio: " << precio; // Precio: 19.99</code></pre>
<h3>Control de flujo</h3>
<p>Las estructuras <code>if/else</code> y los bucles <code>for</code>/<code>while</code> funcionan igual que en la mayoria de lenguajes:</p>
<pre><code>for (int i = 0; i < 5; i++) {
    std::cout << i << " ";
}
// 0 1 2 3 4</code></pre>
<p>La clave al depurar en C++ es nombrar bien tus variables y usarlas correctamente con <code>cout</code>.</p>',
  1, 25, 1, 0, 60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 6 AND slug = 'cpp-sintaxis-esencial'
);

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_free_demo, xp_reward
)
SELECT
  7,
  'C# y .NET: primeros pasos',
  'csharp-dotnet-primeros-pasos',
  'Estructura de proyectos, tipos basicos y salida por consola en C#.',
  '<h2>Primeros pasos con C# y .NET</h2>
<p>C# es el lenguaje principal del ecosistema .NET de Microsoft. Se usa para desarrollo web (ASP.NET), aplicaciones de escritorio (WPF/MAUI), videojuegos (Unity) y servicios en la nube.</p>
<h3>Estructura de un programa</h3>
<p>Un programa minimo en C# tiene un namespace, una clase y el metodo estatico <code>Main</code>:</p>
<pre><code>namespace MiApp {
    class Programa {
        static void Main(string[] args) {
            Console.WriteLine("Hola, .NET!");
        }
    }
}</code></pre>
<h3>Variables y tipos</h3>
<p>C# es fuertemente tipado pero permite inferencia con <code>var</code>:</p>
<pre><code>int total = 2 + 3;
var mensaje = "Resultado: " + total;
Console.WriteLine(mensaje);  // Resultado: 5</code></pre>
<h3>Salida por consola</h3>
<p><code>Console.WriteLine()</code> imprime el valor de cualquier variable y agrega un salto de linea:</p>
<pre><code>int total = 2 + 3;
Console.WriteLine(total);  // 5</code></pre>
<p>Aprende a identificar la variable que almacena el resultado de una operacion: es lo que le pasas a <code>Console.WriteLine()</code>.</p>',
  1, 25, 1, 0, 60
WHERE NOT EXISTS (
  SELECT 1 FROM lessons WHERE learning_path_id = 7 AND slug = 'csharp-dotnet-primeros-pasos'
);
