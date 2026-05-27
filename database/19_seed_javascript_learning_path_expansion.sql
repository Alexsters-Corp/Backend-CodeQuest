-- CodeQuest JavaScript curriculum expansion.
-- Original CodeQuest content inspired by common tutorial progression.
-- No third-party tutorial text is copied.

START TRANSACTION;

INSERT INTO learning_paths (
  programming_language_id, name, slug, description, difficulty_level, estimated_hours, is_active
)
SELECT id, 'JavaScript Intermedio', 'javascript-intermediate',
       'Profundiza en modulos, colecciones, asincronia, errores y programacion orientada a objetos en JavaScript.',
       'intermedio', 55, 1
FROM programming_languages
WHERE slug = 'javascript'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  difficulty_level = VALUES(difficulty_level),
  estimated_hours = VALUES(estimated_hours),
  is_active = VALUES(is_active);

UPDATE learning_paths
SET description = 'Ruta inicial para dominar sintaxis, control de flujo, funciones, arrays, objetos y DOM basico en JavaScript moderno.',
    estimated_hours = 55,
    difficulty_level = 'principiante',
    is_active = 1
WHERE slug = 'javascript-essentials';

UPDATE learning_paths
SET description = 'Ruta avanzada con asincronia profunda, concurrencia, metaprogramacion, rendimiento y APIs modernas del lenguaje.',
    estimated_hours = 75,
    difficulty_level = 'avanzado',
    is_active = 1
WHERE slug = 'javascript-advanced';

UPDATE lessons l
JOIN learning_paths lp ON lp.id = l.learning_path_id
JOIN programming_languages pl ON pl.id = lp.programming_language_id
SET l.order_position = l.order_position + 10000
WHERE pl.slug = 'javascript'
  AND l.order_position < 10000
  AND l.slug NOT IN (
    'js-fundamentos',
    'js-salida-operadores',
    'js-condicionales-bucles',
    'js-funciones-scope',
    'js-arrays-basicos',
    'js-objetos-json',
    'js-dom-eventos',
    'js-modulos-import-export',
    'js-arrays-avanzados',
    'js-sets-maps',
    'js-async-fetch',
    'js-errores-debugging',
    'js-clases-poo',
    'js-asincronia',
    'js-promesas-concurrencia',
    'js-metaprogramacion-proxies',
    'js-rendimiento-memoria',
    'js-apis-modernas',
    'js-temporal-futuro',
    'js-proyecto-final'
  );

CREATE TEMPORARY TABLE js_curriculum_seed (
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

INSERT INTO js_curriculum_seed (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code
) VALUES
('javascript-essentials', 'Fundamentos de JavaScript', 'js-fundamentos',
'Variables, tipos de datos, operadores y salida por consola en JavaScript moderno.',
'<h2>Fundamentos de JavaScript</h2>
<p>JavaScript permite crear interacciones en el navegador y servicios con Node.js. En CodeQuest empezamos con programas pequenos: declarar datos, transformarlos y observar el resultado.</p>
<h3>Variables con const y let</h3>
<p>Usa <code>const</code> cuando una referencia no debe reasignarse y <code>let</code> cuando el valor cambia durante el flujo.</p>
<pre><code>const nombre = "CodeQuest"
let intentos = 0
intentos += 1
console.log(nombre, intentos)</code></pre>
<h3>Tipos basicos</h3>
<p>Los tipos mas comunes son string, number, boolean, null, undefined, object y symbol. Reconocerlos ayuda a evitar errores al comparar o transformar datos.</p>
<pre><code>const activo = true
const puntos = 50
const mensaje = "Ruta iniciada"</code></pre>
<p>La practica de esta leccion consiste en identificar que valor debe enviarse a consola.</p>',
1, 20, 50, 'nombre',
'La variable <code>nombre</code> contiene el texto que debe mostrarse.',
'Completa el identificador faltante para imprimir el nombre de la plataforma.',
'const nombre = "CodeQuest"\nconst puntos = 50\nconsole.log(_____)'),

('javascript-essentials', 'Salida, operadores y conversiones', 'js-salida-operadores',
'Uso de console.log, operadores aritmeticos, comparaciones y conversiones explicitas.',
'<h2>Salida, operadores y conversiones</h2>
<p>Una forma clara de aprender JavaScript es ejecutar una expresion, imprimir el resultado y comprobar si coincide con lo esperado.</p>
<h3>Operadores</h3>
<p>Los operadores aritmeticos calculan valores; los operadores de comparacion producen booleanos.</p>
<pre><code>const subtotal = 80
const impuesto = 20
const total = subtotal + impuesto
console.log(total)</code></pre>
<h3>Conversiones</h3>
<p>Convierte datos de forma explicita cuando recibes informacion desde formularios o APIs.</p>
<pre><code>const entrada = "42"
const numero = Number(entrada)
console.log(numero + 8)</code></pre>
<p>Evita depender de conversiones implicitas porque pueden ocultar fallos dificiles de depurar.</p>',
2, 18, 45, 'total',
'<code>total</code> almacena la suma final de subtotal e impuesto.',
'Completa el identificador faltante para mostrar el total calculado.',
'const subtotal = 80\nconst impuesto = 20\nconst total = subtotal + impuesto\nconsole.log(_____)'),

('javascript-essentials', 'Condicionales y bucles', 'js-condicionales-bucles',
'Control de flujo con if, else, for y while para tomar decisiones y repetir tareas.',
'<h2>Condicionales y bucles</h2>
<p>El control de flujo permite que un programa responda a datos distintos. Una condicion decide que camino tomar y un bucle repite una accion mientras sea necesario.</p>
<h3>Condicionales</h3>
<pre><code>const puntos = 85
const etiqueta = puntos >= 80 ? "aprobado" : "revisar"
console.log(etiqueta)</code></pre>
<h3>Bucles</h3>
<p>Usa <code>for</code> cuando conoces la cantidad de repeticiones y <code>while</code> cuando dependes de una condicion externa.</p>
<pre><code>for (let paso = 1; paso <= 3; paso += 1) {
  console.log("Paso", paso)
}</code></pre>
<p>En proyectos reales, los bucles recorren listas de usuarios, productos, respuestas o eventos.</p>',
3, 22, 50, 'etiqueta',
'La variable <code>etiqueta</code> guarda el resultado de la decision.',
'Completa el identificador faltante para mostrar el estado calculado.',
'const puntos = 85\nconst etiqueta = puntos >= 80 ? "aprobado" : "revisar"\nconsole.log(_____)'),

('javascript-essentials', 'Funciones y alcance', 'js-funciones-scope',
'Funciones declaradas, funciones flecha, parametros, retorno y alcance de variables.',
'<h2>Funciones y alcance</h2>
<p>Una funcion encapsula una accion que puede reutilizarse. Sus parametros reciben datos y <code>return</code> entrega un resultado.</p>
<h3>Funcion flecha</h3>
<pre><code>const duplicar = (numero) => numero * 2
const resultado = duplicar(6)
console.log(resultado)</code></pre>
<h3>Alcance</h3>
<p>Las variables declaradas dentro de una funcion solo existen en ese bloque. Mantener alcances pequenos reduce errores.</p>
<pre><code>function crearSaludo(nombre) {
  const mensaje = `Hola, ${nombre}`
  return mensaje
}</code></pre>
<p>Cuando una funcion retorna un valor, normalmente lo guardas en una variable para usarlo despues.</p>',
4, 22, 55, 'resultado',
'<code>resultado</code> contiene el valor devuelto por la funcion <code>duplicar</code>.',
'Completa el identificador faltante para imprimir el valor retornado.',
'const duplicar = (numero) => numero * 2\nconst resultado = duplicar(6)\nconsole.log(_____)'),

('javascript-essentials', 'Arrays desde cero', 'js-arrays-basicos',
'Creacion de arrays, lectura por indice, push, includes, map y filter.',
'<h2>Arrays desde cero</h2>
<p>Un array agrupa valores ordenados. Puedes leer elementos por indice, agregar elementos y crear nuevas listas a partir de transformaciones.</p>
<h3>Transformar con map</h3>
<pre><code>const numeros = [1, 2, 3]
const dobles = numeros.map((numero) => numero * 2)
console.log(dobles)</code></pre>
<h3>Filtrar datos</h3>
<pre><code>const edades = [12, 18, 25]
const mayores = edades.filter((edad) => edad >= 18)</code></pre>
<p>En CodeQuest priorizamos metodos que producen nuevos arrays porque son claros, predecibles y faciles de probar.</p>',
5, 24, 55, 'dobles',
'La variable <code>dobles</code> contiene el nuevo array creado con <code>map</code>.',
'Completa el identificador faltante para imprimir el array transformado.',
'const numeros = [1, 2, 3]\nconst dobles = numeros.map((numero) => numero * 2)\nconsole.log(_____)'),

('javascript-essentials', 'Objetos y JSON', 'js-objetos-json',
'Representacion de entidades con objetos, acceso a propiedades y serializacion JSON.',
'<h2>Objetos y JSON</h2>
<p>Los objetos representan entidades con propiedades. Son la base de la mayoria de datos que viajan entre frontend, backend y APIs.</p>
<h3>Acceso a propiedades</h3>
<pre><code>const usuario = {
  nombre: "Ada",
  rol: "admin"
}
console.log(usuario.nombre)</code></pre>
<h3>JSON</h3>
<p>JSON es un formato de texto para intercambiar datos. Usa <code>JSON.stringify</code> para convertir un objeto en texto y <code>JSON.parse</code> para reconstruirlo.</p>
<pre><code>const texto = JSON.stringify(usuario)
const copia = JSON.parse(texto)</code></pre>
<p>Dominar objetos facilita entender respuestas HTTP, configuraciones y estados de interfaz.</p>',
6, 24, 55, 'usuario.nombre',
'<code>usuario.nombre</code> accede directamente a la propiedad que se necesita imprimir.',
'Completa la expresion faltante para imprimir el nombre del usuario.',
'const usuario = { nombre: "Ada", rol: "admin" }\nconsole.log(_____)'),

('javascript-essentials', 'DOM y eventos esenciales', 'js-dom-eventos',
'Seleccion de elementos, actualizacion de texto y manejo de eventos del navegador.',
'<h2>DOM y eventos esenciales</h2>
<p>El DOM es la representacion que el navegador crea de una pagina. JavaScript puede leer elementos, cambiar contenido y reaccionar a eventos del usuario.</p>
<h3>Seleccionar y actualizar</h3>
<pre><code>const titulo = document.querySelector("#titulo")
titulo.textContent = "Bienvenido a CodeQuest"</code></pre>
<h3>Eventos</h3>
<pre><code>const boton = document.querySelector("#guardar")
boton.addEventListener("click", () => {
  console.log("Guardado")
})</code></pre>
<p>En una aplicacion real, los eventos conectan botones, formularios, validaciones y navegacion.</p>',
7, 26, 60, 'mensaje',
'La variable <code>mensaje</code> contiene el texto que luego podria ir al DOM.',
'Completa el identificador faltante para imprimir el mensaje del evento.',
'const mensaje = "Guardado"\nconsole.log(_____)'),

('javascript-intermediate', 'Modulos import y export', 'js-modulos-import-export',
'Organizacion de codigo con modulos ES, exportaciones nombradas y dependencias explicitas.',
'<h2>Modulos import y export</h2>
<p>Los modulos dividen una aplicacion en piezas pequenas. Cada archivo declara que comparte y que necesita de otros archivos.</p>
<h3>Exportar e importar</h3>
<pre><code>// math.js
export const calcularArea = (radio) => Math.PI * radio ** 2

// app.js
import { calcularArea } from "./math.js"
const area = calcularArea(5)</code></pre>
<p>Trabajar con modulos mejora el mantenimiento porque las dependencias quedan visibles.</p>',
1, 24, 60, 'area',
'<code>area</code> almacena el resultado importado desde el modulo de calculo.',
'Completa el identificador faltante para mostrar el area calculada.',
'const calcularArea = (radio) => Math.PI * radio ** 2\nconst area = calcularArea(5)\nconsole.log(_____)'),

('javascript-intermediate', 'Arrays avanzados y reduccion', 'js-arrays-avanzados',
'Uso de reduce, some, every, find, flatMap y copias inmutables para colecciones.',
'<h2>Arrays avanzados y reduccion</h2>
<p>Cuando una lista crece, necesitas metodos expresivos para buscar, validar, agrupar o acumular datos.</p>
<h3>reduce</h3>
<pre><code>const compras = [20, 30, 50]
const total = compras.reduce((acum, valor) => acum + valor, 0)</code></pre>
<h3>find y every</h3>
<pre><code>const usuarios = [{ activo: true }, { activo: false }]
const activos = usuarios.filter((usuario) => usuario.activo)</code></pre>
<p>Elige el metodo por intencion: transformar, filtrar, buscar, validar o acumular.</p>',
2, 28, 65, 'activos',
'<code>activos</code> contiene solo los usuarios que cumplen la condicion.',
'Completa el identificador faltante para imprimir la lista filtrada.',
'const usuarios = [{ activo: true }, { activo: false }]\nconst activos = usuarios.filter((usuario) => usuario.activo)\nconsole.log(_____)'),

('javascript-intermediate', 'Sets, Maps e iteraciones', 'js-sets-maps',
'Colecciones especializadas para valores unicos, pares clave valor e iteracion segura.',
'<h2>Sets, Maps e iteraciones</h2>
<p><code>Set</code> almacena valores unicos y <code>Map</code> almacena pares clave valor sin limitarse a claves string.</p>
<h3>Set para quitar duplicados</h3>
<pre><code>const etiquetas = ["js", "web", "js"]
const unicas = new Set(etiquetas)
const totalUnicos = unicas.size</code></pre>
<h3>Map para conteos</h3>
<pre><code>const visitas = new Map()
visitas.set("inicio", 3)</code></pre>
<p>Estas colecciones hacen mas clara la intencion cuando arrays u objetos se quedan cortos.</p>',
3, 25, 60, 'totalUnicos',
'<code>totalUnicos</code> guarda el tamano del Set.',
'Completa el identificador faltante para imprimir cuantos valores unicos existen.',
'const etiquetas = ["js", "web", "js"]\nconst unicas = new Set(etiquetas)\nconst totalUnicos = unicas.size\nconsole.log(_____)'),

('javascript-intermediate', 'Fetch, APIs y async await', 'js-async-fetch',
'Consumo de APIs con fetch, Promises, async await y manejo de respuestas JSON.',
'<h2>Fetch, APIs y async await</h2>
<p>Las aplicaciones modernas hablan con APIs. <code>fetch</code> devuelve una Promise y <code>await</code> permite leer el resultado paso a paso.</p>
<h3>Patron basico</h3>
<pre><code>async function cargarPerfil() {
  const respuesta = await fetch("/api/perfil")
  const datos = await respuesta.json()
  return datos
}</code></pre>
<p>Antes de usar datos externos, valida estados HTTP, estructura y errores posibles.</p>',
4, 30, 70, 'datos',
'La variable <code>datos</code> representa el JSON procesado de la respuesta.',
'Completa el identificador faltante para imprimir los datos procesados.',
'const respuesta = { ok: true }\nconst datos = { usuario: "Ada", activo: true }\nconsole.log(_____)'),

('javascript-intermediate', 'Errores y depuracion', 'js-errores-debugging',
'try catch, errores personalizados, trazas y estrategias de depuracion controlada.',
'<h2>Errores y depuracion</h2>
<p>Un error bien manejado evita que toda la aplicacion se rompa. JavaScript permite capturar errores y transformar fallos tecnicos en mensajes utiles.</p>
<h3>try catch</h3>
<pre><code>try {
  throw new Error("Dato invalido")
} catch (error) {
  const mensaje = error.message
  console.log(mensaje)
}</code></pre>
<p>Depurar no es imprimir todo: es formular una hipotesis, observar datos clave y confirmar el flujo.</p>',
5, 24, 60, 'mensaje',
'<code>mensaje</code> guarda el texto legible del error.',
'Completa el identificador faltante para imprimir el mensaje capturado.',
'try {\n  throw new Error("Dato invalido")\n} catch (error) {\n  const mensaje = error.message\n  console.log(_____)\n}'),

('javascript-intermediate', 'Clases y objetos modernos', 'js-clases-poo',
'Clases, constructores, metodos, campos privados y encapsulamiento moderno.',
'<h2>Clases y objetos modernos</h2>
<p>Las clases ofrecen una sintaxis clara para construir objetos con estado y comportamiento.</p>
<h3>Constructor y metodo</h3>
<pre><code>class Curso {
  constructor(titulo) {
    this.titulo = titulo
  }
  resumen() {
    return `Curso: ${this.titulo}`
  }
}</code></pre>
<p>JavaScript moderno tambien permite campos privados para ocultar detalles internos de una clase.</p>',
6, 28, 70, 'resumen',
'<code>resumen</code> almacena el texto devuelto por el metodo de la instancia.',
'Completa el identificador faltante para imprimir el resumen del curso.',
'class Curso {\n  constructor(titulo) { this.titulo = titulo }\n  resumen() { return `Curso: ${this.titulo}` }\n}\nconst curso = new Curso("JavaScript")\nconst resumen = curso.resumen()\nconsole.log(_____)'),

('javascript-advanced', 'Asincronia en JavaScript', 'js-asincronia',
'Event loop, tareas asincronas, Promises, async await y errores en flujos no bloqueantes.',
'<h2>Asincronia en JavaScript</h2>
<p>JavaScript ejecuta una tarea principal a la vez, pero el entorno puede delegar temporizadores, red y eventos. El event loop coordina cuando vuelven los callbacks y Promises.</p>
<h3>async await</h3>
<pre><code>async function preparar() {
  const dobles = [1, 2, 3].map((n) => n * 2)
  return dobles
}</code></pre>
<h3>Manejo de errores</h3>
<p>Combina <code>try/catch</code> con <code>await</code> para responder a fallos sin bloquear la interfaz.</p>
<pre><code>try {
  const datos = await preparar()
  console.log(datos)
} catch (error) {
  console.error(error.message)
}</code></pre>',
1, 30, 70, 'dobles',
'<code>dobles</code> representa el array producido dentro del flujo asincrono.',
'Completa el identificador faltante para mostrar el array preparado.',
'const dobles = [1, 2, 3].map((n) => n * 2)\nconsole.log(_____)'),

('javascript-advanced', 'Promesas y concurrencia controlada', 'js-promesas-concurrencia',
'Promise.all, Promise.allSettled, Promise.race y control de tareas concurrentes.',
'<h2>Promesas y concurrencia controlada</h2>
<p>Cuando varias tareas asincronas no dependen entre si, puedes ejecutarlas en paralelo. La clave es elegir la estrategia correcta.</p>
<h3>Promise.all</h3>
<pre><code>const nombres = await Promise.all([
  Promise.resolve("Ada"),
  Promise.resolve("Linus")
])</code></pre>
<h3>allSettled</h3>
<p><code>Promise.allSettled</code> conserva resultados exitosos y fallidos, util para paneles que no deben caer por una sola API.</p>',
2, 30, 75, 'nombres',
'<code>nombres</code> contiene el arreglo resuelto por <code>Promise.all</code>.',
'Completa el identificador faltante para imprimir los nombres resueltos.',
'const nombres = ["Ada", "Linus"]\nconsole.log(_____)'),

('javascript-advanced', 'Metaprogramacion con Proxy y Reflect', 'js-metaprogramacion-proxies',
'Interceptar operaciones sobre objetos con Proxy y delegar comportamiento con Reflect.',
'<h2>Metaprogramacion con Proxy y Reflect</h2>
<p>Un <code>Proxy</code> permite interceptar lecturas, escrituras y otras operaciones sobre un objeto. Es util para validaciones, observabilidad y APIs dinamicas.</p>
<h3>Interceptar escritura</h3>
<pre><code>const estado = new Proxy({ valor: 1 }, {
  set(objetivo, propiedad, valor) {
    objetivo[propiedad] = valor
    return true
  }
})
estado.valor = 2</code></pre>
<p>Usa esta tecnica con cuidado: agrega poder, pero tambien complejidad.</p>',
3, 32, 80, 'estado.valor',
'<code>estado.valor</code> lee el valor final almacenado en el objeto proxificado.',
'Completa la expresion faltante para imprimir el valor actualizado.',
'const estado = new Proxy({ valor: 1 }, { set(objetivo, propiedad, valor) { objetivo[propiedad] = valor; return true } })\nestado.valor = 2\nconsole.log(_____)'),

('javascript-advanced', 'Rendimiento, memoria y codigo no bloqueante', 'js-rendimiento-memoria',
'Buenas practicas para evitar bloqueos, reducir trabajo innecesario y medir antes de optimizar.',
'<h2>Rendimiento, memoria y codigo no bloqueante</h2>
<p>Optimizar JavaScript empieza midiendo. Evita repetir calculos costosos, conserva estructuras simples y divide trabajo pesado cuando afecte la experiencia.</p>
<h3>Reducir trabajo repetido</h3>
<pre><code>const precios = [10, 20, 30]
const total = precios.reduce((suma, precio) => suma + precio, 0)</code></pre>
<p>En interfaces, tambien importa no bloquear el hilo principal con bucles largos o renderizados innecesarios.</p>',
4, 26, 70, 'total',
'<code>total</code> almacena la suma calculada una sola vez.',
'Completa el identificador faltante para imprimir el total acumulado.',
'const precios = [10, 20, 30]\nconst total = precios.reduce((suma, precio) => suma + precio, 0)\nconsole.log(_____)'),

('javascript-advanced', 'APIs modernas del lenguaje', 'js-apis-modernas',
'Optional chaining, nullish coalescing, copias inmutables y metodos modernos de arrays.',
'<h2>APIs modernas del lenguaje</h2>
<p>JavaScript evoluciona cada ano. Algunas mejoras actuales hacen el codigo mas seguro y expresivo sin depender de librerias externas.</p>
<h3>Acceso seguro</h3>
<pre><code>const perfil = { usuario: { nombre: "Ada" } }
const resultado = perfil.usuario?.nombre ?? "Sin nombre"</code></pre>
<h3>Copias inmutables</h3>
<p>Metodos como <code>toSorted</code> y <code>toSpliced</code> devuelven nuevos arrays y evitan modificar el original.</p>
<p>Tambien existen metodos modernos para Set en entornos recientes; revisa compatibilidad antes de usarlos en produccion.</p>',
5, 30, 80, 'resultado',
'<code>resultado</code> contiene el nombre o un valor de respaldo.',
'Completa el identificador faltante para imprimir el resultado seguro.',
'const perfil = { usuario: { nombre: "Ada" } }\nconst resultado = perfil.usuario?.nombre ?? "Sin nombre"\nconsole.log(_____)'),

('javascript-advanced', 'Temporal y manejo futuro de fechas', 'js-temporal-futuro',
'Limitaciones de Date, enfoque de Temporal y decisiones de compatibilidad.',
'<h2>Temporal y manejo futuro de fechas</h2>
<p>La API <code>Date</code> existe desde los inicios de JavaScript, pero mezcla zonas horarias, parseo y mutabilidad de forma dificil de razonar.</p>
<h3>Practica compatible hoy</h3>
<pre><code>const fecha = new Date("2026-05-27T00:00:00Z")
const fechaISO = fecha.toISOString().slice(0, 10)</code></pre>
<h3>Mirada moderna</h3>
<p><code>Temporal</code> propone tipos mas precisos para fechas, horas, duraciones y zonas. Al adoptarla, revisa soporte del runtime o usa polyfill autorizado.</p>',
6, 28, 75, 'fechaISO',
'<code>fechaISO</code> guarda una representacion estable en formato fecha.',
'Completa el identificador faltante para imprimir la fecha normalizada.',
'const fecha = new Date("2026-05-27T00:00:00Z")\nconst fechaISO = fecha.toISOString().slice(0, 10)\nconsole.log(_____)'),

('javascript-advanced', 'Proyecto final: mini cliente de datos', 'js-proyecto-final',
'Integracion de modulos, arrays, async await, errores y renderizado de datos.',
'<h2>Proyecto final: mini cliente de datos</h2>
<p>Una ruta avanzada debe cerrar integrando conceptos. El objetivo es leer datos, transformarlos, manejar errores y preparar una salida clara para la interfaz.</p>
<h3>Flujo del proyecto</h3>
<pre><code>async function construirResumen(items) {
  const activos = items.filter((item) => item.activo)
  return activos.map((item) => item.nombre).join(", ")
}</code></pre>
<p>Este tipo de proyecto conecta fundamentos, colecciones, asincronia y presentacion en una pieza pequena pero realista.</p>',
7, 35, 90, 'resumen',
'<code>resumen</code> contiene la salida final lista para mostrar.',
'Completa el identificador faltante para imprimir el resumen construido.',
'const items = [{ nombre: "DOM", activo: true }, { nombre: "Legacy", activo: false }]\nconst resumen = items.filter((item) => item.activo).map((item) => item.nombre).join(", ")\nconsole.log(_____)');

INSERT INTO lessons (
  learning_path_id, title, slug, description, content,
  order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward
)
SELECT
  lp.id, seed.title, seed.slug, seed.description, seed.content,
  seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM js_curriculum_seed seed
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
FROM js_curriculum_seed seed
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
JOIN js_curriculum_seed seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica la variable indicada en el ejercicio.', 0, 10, 1
FROM js_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe ejecutarse sin errores de sintaxis.', 0, 10, 2
FROM js_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Mantiene una salida clara para consola.', 1, 10, 3
FROM js_curriculum_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE js_curriculum_seed;

COMMIT;
