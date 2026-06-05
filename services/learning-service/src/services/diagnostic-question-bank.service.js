const LEVEL_WEIGHTS = {
  principiante: 1,
  intermedio: 2,
  avanzado: 3,
}

const EXAM_QUESTIONS_PER_LEVEL = 4

const LANGUAGE_PROFILES = [
  {
    key: 'python',
    aliases: ['python'],
    displayName: 'Python',
    print: 'print(valor)',
    variableDeclaration: 'contador = 0',
    conditionExample: 'if condicion:',
    loopExample: 'for item in items:',
    commentSyntax: '# comentario',
    mapExpression: '[x * 2 for x in datos]',
    errorHandler: 'except Exception as e:',
    packageCommand: 'pip install requests',
    importExample: 'from modulo import funcion',
    asyncPattern: 'async def tarea():',
    benchmarkTool: 'cProfile + timeit',
    testTool: 'pytest con pruebas parametrizadas',
    immutableUpdate: 'crear un nuevo dict/lista sin mutar el original',
    typingExample: 'def sumar(a: int, b: int) -> int:',
  },
  {
    key: 'javascript',
    aliases: ['javascript', 'node', 'js'],
    displayName: 'JavaScript',
    print: 'console.log(valor)',
    variableDeclaration: 'let contador = 0',
    conditionExample: 'if (condicion) { ... }',
    loopExample: 'for (const item of items) { ... }',
    commentSyntax: '// comentario',
    mapExpression: 'datos.map((x) => x * 2)',
    errorHandler: 'catch (error) { ... }',
    packageCommand: 'npm install axios',
    importExample: "import { fn } from './modulo.js'",
    asyncPattern: 'async function tarea() { await trabajo(); }',
    benchmarkTool: 'Node.js --prof + Performance API',
    testTool: 'Vitest o Jest con mocks',
    immutableUpdate: 'usar spread: { ...obj, campo: nuevoValor }',
    typingExample: 'const sumar = (a, b) => a + b',
  },
  {
    key: 'java',
    aliases: ['java'],
    displayName: 'Java',
    print: 'System.out.println(valor);',
    variableDeclaration: 'int contador = 0;',
    conditionExample: 'if (condicion) { ... }',
    loopExample: 'for (Item item : items) { ... }',
    commentSyntax: '// comentario',
    mapExpression: 'lista.stream().map(x -> x * 2).toList()',
    errorHandler: 'catch (Exception e) { ... }',
    packageCommand: 'mvn dependency:add -Dartifact=... o Gradle',
    importExample: 'import paquete.Clase;',
    asyncPattern: 'CompletableFuture.supplyAsync(() -> tarea())',
    benchmarkTool: 'JMH (Java Microbenchmark Harness)',
    testTool: 'JUnit + Mockito',
    immutableUpdate: 'usar objetos inmutables y builders',
    typingExample: 'int sumar(int a, int b) { return a + b; }',
  },
  {
    key: 'cpp',
    aliases: ['c++', 'cpp', 'gcc'],
    displayName: 'C++',
    print: 'std::cout << valor << std::endl;',
    variableDeclaration: 'int contador = 0;',
    conditionExample: 'if (condicion) { ... }',
    loopExample: 'for (const auto& item : items) { ... }',
    commentSyntax: '// comentario',
    mapExpression: 'std::transform(inicio, fin, out.begin(), fn);',
    errorHandler: 'catch (const std::exception& e) { ... }',
    packageCommand: 'vcpkg install fmt o Conan install',
    importExample: '#include <vector>',
    asyncPattern: 'std::async(std::launch::async, tarea)',
    benchmarkTool: 'Google Benchmark + perf',
    testTool: 'GoogleTest',
    immutableUpdate: 'usar const y devolver nuevas estructuras',
    typingExample: 'int sumar(int a, int b) { return a + b; }',
  },
  {
    key: 'csharp',
    aliases: ['c#', 'csharp', '.net', 'dotnet'],
    displayName: 'C#',
    print: 'Console.WriteLine(valor);',
    variableDeclaration: 'int contador = 0;',
    conditionExample: 'if (condicion) { ... }',
    loopExample: 'foreach (var item in items) { ... }',
    commentSyntax: '// comentario',
    mapExpression: 'items.Select(x => x * 2).ToList()',
    errorHandler: 'catch (Exception ex) { ... }',
    packageCommand: 'dotnet add package Newtonsoft.Json',
    importExample: 'using MiProyecto.Modulo;',
    asyncPattern: 'async Task TareaAsync() { await TrabajoAsync(); }',
    benchmarkTool: 'BenchmarkDotNet',
    testTool: 'xUnit + Moq',
    immutableUpdate: 'usar record con with: obj with { Campo = valor }',
    typingExample: 'int Sumar(int a, int b) => a + b;',
  },
  {
    key: 'ruby',
    aliases: ['ruby'],
    displayName: 'Ruby',
    print: 'puts valor',
    variableDeclaration: 'contador = 0',
    conditionExample: 'if condicion ... end',
    loopExample: 'for item in items ... end',
    commentSyntax: '# comentario',
    mapExpression: 'datos.map { |x| x * 2 }',
    errorHandler: 'rescue StandardError => e',
    packageCommand: 'gem install bundler',
    importExample: "require 'net/http'",
    asyncPattern: 'Thread.new { tarea }',
    benchmarkTool: 'Benchmark.bm',
    testTool: 'RSpec',
    immutableUpdate: 'usar dup y freeze',
    typingExample: 'def sumar(a, b) a + b end',
  },
  {
    key: 'go',
    aliases: ['go', 'golang'],
    displayName: 'Go',
    print: 'fmt.Println(valor)',
    variableDeclaration: 'contador := 0',
    conditionExample: 'if condicion { ... }',
    loopExample: 'for _, item := range items { ... }',
    commentSyntax: '// comentario',
    mapExpression: 'for _, x := range datos { res = append(res, x * 2) }',
    errorHandler: 'if err != nil { return err }',
    packageCommand: 'go get github.com/gin-gonic/gin',
    importExample: 'import "fmt"',
    asyncPattern: 'go tarea()',
    benchmarkTool: 'go test -bench=.',
    testTool: 'go test con testing.T',
    immutableUpdate: 'copiar slice con copy() y retornar nuevo',
    typingExample: 'func sumar(a int, b int) int { return a + b }',
  },
]

const QUESTION_TEMPLATES = [
  {
    id: 'b-print',
    level: 'principiante',
    prompt: (profile) => `En ${profile.displayName}, ¿qué instrucción imprime un valor en consola?`,
    options: (profile) => [
      profile.print,
      'echo valor',
      'output(valor)',
      'printLine(valor)',
    ],
    correctOption: 0,
  },
  {
    id: 'b-variable',
    level: 'principiante',
    prompt: (profile) => `Selecciona una declaración de variable válida y mutable en ${profile.displayName}.`,
    options: (profile) => [
      profile.variableDeclaration,
      'const contador: int = 0',
      'contador :=: 0',
      'define contador -> 0',
    ],
    correctOption: 0,
  },
  {
    id: 'b-condition',
    level: 'principiante',
    prompt: (profile) => `¿Cuál opción representa una estructura condicional típica en ${profile.displayName}?`,
    options: (profile) => [
      profile.conditionExample,
      'when condicion then do',
      'switch => condicion',
      'if condicion then endif',
    ],
    correctOption: 0,
  },
  {
    id: 'b-loop',
    level: 'principiante',
    prompt: (profile) => `¿Qué patrón es común para iterar una colección en ${profile.displayName}?`,
    options: (profile) => [
      profile.loopExample,
      'repeat each item -> execute',
      'loop(item) :: items',
      'iterate(items) { item => ... } sin control',
    ],
    correctOption: 0,
  },
  {
    id: 'b-comment',
    level: 'principiante',
    prompt: (profile) => `¿Qué sintaxis corresponde a un comentario de una línea en ${profile.displayName}?`,
    options: (profile) => [
      profile.commentSyntax,
      '<!-- comentario -->',
      '(* comentario *)',
      '" comentario "',
    ],
    correctOption: 0,
  },
  {
    id: 'i-map',
    level: 'intermedio',
    prompt: (profile) => `Si quieres transformar cada elemento de una colección en ${profile.displayName}, ¿qué opción es más idiomática?`,
    options: (profile) => [
      profile.mapExpression,
      'copiar y pegar un bucle en cada archivo',
      'serializar a texto y volver a parsear',
      'usar recursión infinita para mapear',
    ],
    correctOption: 0,
  },
  {
    id: 'i-errors',
    level: 'intermedio',
    prompt: (profile) => `Ante una operación I/O que falla en ${profile.displayName}, ¿qué bloque de manejo de errores es apropiado?`,
    options: (profile) => [
      profile.errorHandler,
      'ignorar la excepción y continuar',
      'ocultar logs para no ver errores',
      'reiniciar el proceso en cada fallo menor',
    ],
    correctOption: 0,
  },
  {
    id: 'i-package',
    level: 'intermedio',
    prompt: (profile) => `¿Qué comando/herramienta de dependencias corresponde mejor a ${profile.displayName}?`,
    options: (profile) => [
      profile.packageCommand,
      'copiar binarios manualmente al sistema',
      'descargar archivos al azar y pegarlos',
      'evitar cualquier gestor de dependencias',
    ],
    correctOption: 0,
  },
  {
    id: 'i-import',
    level: 'intermedio',
    prompt: (profile) => `¿Qué ejemplo refleja una importación/inclusión típica en ${profile.displayName}?`,
    options: (profile) => [
      profile.importExample,
      'copiar todo el módulo como comentario',
      'renombrar archivos hasta que compile',
      'usar variables globales en vez de módulos',
    ],
    correctOption: 0,
  },
  {
    id: 'i-typing',
    level: 'intermedio',
    prompt: (profile) => `¿Cuál firma/estilo de función encaja con ${profile.displayName} y comunica intención con claridad?`,
    options: (profile) => [
      profile.typingExample,
      'funcion(a,b,c,d,e,f,g,h) // sin propósito claro',
      'usar nombres x1, x2, x3 en todo el código',
      'devolver formatos distintos en cada ejecución',
    ],
    correctOption: 0,
  },
  {
    id: 'a-async',
    level: 'avanzado',
    prompt: (profile) => `Para tareas concurrentes en ${profile.displayName}, ¿qué enfoque es más robusto?`,
    options: (profile) => [
      profile.asyncPattern,
      'bloquear siempre el hilo principal',
      'crear hilos sin límites ni control',
      'eliminar manejo de errores asíncronos',
    ],
    correctOption: 0,
  },
  {
    id: 'a-performance',
    level: 'avanzado',
    prompt: (profile) => `Antes de optimizar prematuramente en ${profile.displayName}, ¿qué herramienta/práctica entrega evidencia real?`,
    options: (profile) => [
      profile.benchmarkTool,
      'adivinar cuellos de botella sin medir',
      'reescribir todo el proyecto primero',
      'desactivar monitoreo para ganar velocidad',
    ],
    correctOption: 0,
  },
  {
    id: 'a-testing',
    level: 'avanzado',
    prompt: (profile) => `¿Qué stack/práctica de pruebas aporta calidad continua en ${profile.displayName}?`,
    options: (profile) => [
      profile.testTool,
      'probar solo manualmente en producción',
      'eliminar pruebas cuando hay deadlines',
      'depender únicamente de logs para validar',
    ],
    correctOption: 0,
  },
  {
    id: 'a-immutability',
    level: 'avanzado',
    prompt: (profile) => `Para reducir efectos colaterales en ${profile.displayName}, ¿qué práctica es recomendable?`,
    options: (profile) => [
      profile.immutableUpdate,
      'mutar estado global desde cualquier función',
      'compartir una variable global para todos los módulos',
      'evitar encapsulación en componentes críticos',
    ],
    correctOption: 0,
  },
  {
    id: 'a-architecture',
    level: 'avanzado',
    prompt: () => 'Cuando escalas un proyecto, ¿qué decisión arquitectónica ayuda a mantener mantenibilidad y pruebas? ',
    options: () => [
      'Separar dominio, infraestructura y presentación con contratos claros',
      'Concentrar toda la lógica en un único archivo gigante',
      'Evitar interfaces para acelerar cambios rápidos',
      'Eliminar observabilidad para simplificar despliegue',
    ],
    correctOption: 0,
  },
]

const LANGUAGE_SPECIFIC_TEMPLATES = {
  python: [
    {
      id: 'b-python-indentation',
      level: 'principiante',
      prompt: () => 'En Python, ¿qué elemento define normalmente el bloque de código dentro de un if, for o función?',
      options: () => ['La indentación consistente', 'Llaves obligatorias como en C', 'Punto y coma al final de cada línea', 'Etiquetas de apertura y cierre'],
      correctOption: 0,
    },
    {
      id: 'i-python-dunder',
      level: 'intermedio',
      prompt: () => '¿Para qué se usa con frecuencia el bloque if __name__ == "__main__" en Python?',
      options: () => ['Para ejecutar código solo cuando el archivo se corre directamente', 'Para importar paquetes desde internet', 'Para declarar variables globales obligatorias', 'Para convertir listas en diccionarios'],
      correctOption: 0,
    },
    {
      id: 'a-python-context',
      level: 'avanzado',
      prompt: () => '¿Qué patrón de Python ayuda a liberar recursos como archivos o conexiones incluso si ocurre un error?',
      options: () => ['Usar context managers con with', 'Mantener archivos abiertos globalmente', 'Ignorar excepciones con pass siempre', 'Reiniciar el intérprete manualmente'],
      correctOption: 0,
    },
  ],
  javascript: [
    {
      id: 'b-js-runtime',
      level: 'principiante',
      prompt: () => 'En JavaScript moderno, ¿qué entorno permite ejecutar código fuera del navegador dentro de CodeQuest?',
      options: () => ['Node.js', 'JVM', 'CPython exclusivamente', 'Ruby MRI'],
      correctOption: 0,
    },
    {
      id: 'i-js-event-loop',
      level: 'intermedio',
      prompt: () => '¿Qué concepto explica cómo JavaScript coordina callbacks, promesas y tareas asíncronas sin bloquear el hilo principal?',
      options: () => ['Event loop', 'Herencia múltiple clásica', 'Compilación Ahead-of-Time obligatoria', 'Garbage collection manual'],
      correctOption: 0,
    },
    {
      id: 'a-js-modules',
      level: 'avanzado',
      prompt: () => '¿Qué práctica favorece mantenibilidad en una base JavaScript moderna con muchos archivos?',
      options: () => ['Separar módulos ES con imports/exports claros', 'Pegar toda la lógica en un único script global', 'Depender de variables implícitas', 'Modificar prototipos nativos sin control'],
      correctOption: 0,
    },
  ],
  java: [
    {
      id: 'b-java-main',
      level: 'principiante',
      prompt: () => 'En Java clásico, ¿qué método suele actuar como punto de entrada de una aplicación de consola?',
      options: () => ['public static void main(String[] args)', 'def main()', 'func main()', 'console.main()'],
      correctOption: 0,
    },
    {
      id: 'i-java-collections',
      level: 'intermedio',
      prompt: () => '¿Qué API de Java permite trabajar con listas, mapas y conjuntos de manera estándar?',
      options: () => ['Java Collections Framework', 'DOM API', 'pip collections', 'Bundler'],
      correctOption: 0,
    },
    {
      id: 'a-java-jvm',
      level: 'avanzado',
      prompt: () => '¿Qué herramienta de la JVM es adecuada para medir rendimiento de código Java con rigor?',
      options: () => ['JMH', 'console.log', 'print manual en cada línea', 'Cambiar nombres de variables'],
      correctOption: 0,
    },
  ],
  cpp: [
    {
      id: 'b-cpp-headers',
      level: 'principiante',
      prompt: () => 'En C++, ¿qué directiva permite incluir declaraciones de bibliotecas como iostream o vector?',
      options: () => ['#include', 'import from', 'using package', 'require'],
      correctOption: 0,
    },
    {
      id: 'i-cpp-raii',
      level: 'intermedio',
      prompt: () => '¿Qué principio de C++ asocia adquisición y liberación de recursos al ciclo de vida de objetos?',
      options: () => ['RAII', 'Event loop', 'Duck typing', 'Monkey patching'],
      correctOption: 0,
    },
    {
      id: 'a-cpp-ownership',
      level: 'avanzado',
      prompt: () => '¿Qué opción reduce fugas de memoria en C++ moderno frente a new/delete manuales?',
      options: () => ['Smart pointers como std::unique_ptr', 'Variables globales mutables', 'Desactivar destructores', 'Reservar memoria sin liberarla'],
      correctOption: 0,
    },
  ],
  csharp: [
    {
      id: 'b-csharp-console',
      level: 'principiante',
      prompt: () => 'En C#, ¿qué instrucción imprime una línea en consola?',
      options: () => ['Console.WriteLine(valor);', 'System.out.println(valor);', 'fmt.Println(valor)', 'puts valor'],
      correctOption: 0,
    },
    {
      id: 'i-csharp-linq',
      level: 'intermedio',
      prompt: () => '¿Qué característica de C# permite consultar y transformar colecciones con una sintaxis expresiva?',
      options: () => ['LINQ', 'Bash pipes obligatorios', 'SQL incrustado sin tipos', 'Macros de preprocesador para listas'],
      correctOption: 0,
    },
    {
      id: 'a-csharp-async',
      level: 'avanzado',
      prompt: () => '¿Qué patrón de C# se usa para operaciones asíncronas sin bloquear el hilo principal?',
      options: () => ['async/await con Task', 'Thread.Sleep como solución principal', 'Bloqueo activo con while infinito', 'Eliminar excepciones'],
      correctOption: 0,
    },
  ],
  go: [
    {
      id: 'b-go-main',
      level: 'principiante',
      prompt: () => 'En Go, ¿qué paquete contiene normalmente el punto de entrada ejecutable?',
      options: () => ['package main', 'namespace Program', 'public class Main', 'module.exports'],
      correctOption: 0,
    },
    {
      id: 'i-go-errors',
      level: 'intermedio',
      prompt: () => '¿Cuál es el patrón idiomático de Go para manejar errores después de una operación?',
      options: () => ['if err != nil { return err }', 'catch (Exception e)', 'rescue StandardError', 'ignorar err siempre'],
      correctOption: 0,
    },
    {
      id: 'a-go-concurrency',
      level: 'avanzado',
      prompt: () => '¿Qué combinación es central para concurrencia idiomática en Go?',
      options: () => ['Goroutines y channels', 'Promesas y DOM', 'Threads sin sincronización', 'Callbacks globales únicamente'],
      correctOption: 0,
    },
  ],
  ruby: [
    {
      id: 'b-ruby-output',
      level: 'principiante',
      prompt: () => 'En Ruby, ¿qué método se usa comúnmente para imprimir una línea en consola?',
      options: () => ['puts valor', 'Console.WriteLine(valor)', 'fmt.Println(valor)', 'System.out.println(valor)'],
      correctOption: 0,
    },
    {
      id: 'i-ruby-blocks',
      level: 'intermedio',
      prompt: () => '¿Qué estructura de Ruby permite pasar comportamiento a métodos como each, map o select?',
      options: () => ['Bloques', 'Headers', 'Interfaces funcionales obligatorias', 'Directivas include'],
      correctOption: 0,
    },
    {
      id: 'a-ruby-meta',
      level: 'avanzado',
      prompt: () => '¿Qué capacidad avanzada de Ruby permite definir comportamiento dinámico en tiempo de ejecución?',
      options: () => ['Metaprogramación', 'Compilación manual de bytecode', 'Memoria con punteros crudos', 'Tipado primitivo obligatorio'],
      correctOption: 0,
    },
  ],
}

function normalizeLanguageName(languageName) {
  if (typeof languageName !== 'string') {
    return ''
  }

  return languageName.trim().toLowerCase()
}

function resolveLanguageProfile(languageName) {
  const normalized = normalizeLanguageName(languageName)

  const profile = LANGUAGE_PROFILES.find((item) =>
    item.aliases.some((alias) => normalized.includes(alias))
  )

  return profile || LANGUAGE_PROFILES[0]
}

function hashSeed(value) {
  const normalized = String(value || 'seed')
  let hash = 0

  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(index)) >>> 0
  }

  return hash || 1
}

function createSeededRng(seed) {
  let state = hashSeed(seed)

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shuffleWithRng(values, rng) {
  const copy = [...values]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(rng() * (index + 1))
    const temp = copy[index]
    copy[index] = copy[randomIndex]
    copy[randomIndex] = temp
  }

  return copy
}

function pickQuestions(questions, count, rng) {
  const required = questions.filter((question) => question.profileSpecific)
  const optional = questions.filter((question) => !question.profileSpecific)
  const remainingCount = Math.max(0, count - required.length)
  return [
    ...required,
    ...shuffleWithRng(optional, rng).slice(0, Math.min(remainingCount, optional.length)),
  ].slice(0, count)
}

function sanitizeOptions(options, correctOption) {
  const normalized = []

  options.forEach((option) => {
    const value = String(option || '').trim()
    if (value && !normalized.includes(value)) {
      normalized.push(value)
    }
  })

  const safeCorrectIndex = Math.max(0, Math.min(correctOption, options.length - 1))
  const correctValue = String(options[safeCorrectIndex] || '').trim()

  if (correctValue && !normalized.includes(correctValue)) {
    normalized.unshift(correctValue)
  }

  return {
    options: normalized.slice(0, 4),
    correctValue,
  }
}

function buildQuestionFromTemplate(template, profile) {
  const rawOptions = template.options(profile)
  const sanitized = sanitizeOptions(rawOptions, template.correctOption)

  return {
    id: `${profile.key}-${template.id}`,
    level: template.level,
    weight: LEVEL_WEIGHTS[template.level] || 1,
    prompt: template.prompt(profile),
    options: sanitized.options,
    correctOption: sanitized.options.findIndex((value) => value === sanitized.correctValue),
  }
}

function buildExam(languageName, attemptSeed = 0) {
  const profile = resolveLanguageProfile(languageName)
  const rng = createSeededRng(`${profile.key}:${attemptSeed}`)

  const byLevel = {
    principiante: [],
    intermedio: [],
    avanzado: [],
  }

  QUESTION_TEMPLATES.forEach((template) => {
    byLevel[template.level].push(buildQuestionFromTemplate(template, profile))
  })

  ;(LANGUAGE_SPECIFIC_TEMPLATES[profile.key] || []).forEach((template) => {
    byLevel[template.level].push({
      ...buildQuestionFromTemplate(template, profile),
      profileSpecific: true,
    })
  })

  // Keep a progressive path: beginner -> intermediate -> advanced.
  const selectedByLevel = {
    principiante: pickQuestions(byLevel.principiante, EXAM_QUESTIONS_PER_LEVEL, rng),
    intermedio: pickQuestions(byLevel.intermedio, EXAM_QUESTIONS_PER_LEVEL, rng),
    avanzado: pickQuestions(byLevel.avanzado, EXAM_QUESTIONS_PER_LEVEL, rng),
  }

  const selected = [
    ...selectedByLevel.principiante,
    ...selectedByLevel.intermedio,
    ...selectedByLevel.avanzado,
  ]

  return selected.map((question) => {
    const correctValue = question.options[question.correctOption]
    const shuffledOptions = shuffleWithRng(question.options, rng)

    return {
      id: question.id,
      level: question.level,
      weight: question.weight,
      prompt: question.prompt,
      options: shuffledOptions,
      correctOption: shuffledOptions.findIndex((option) => option === correctValue),
    }
  })
}

module.exports = {
  LEVEL_WEIGHTS,
  EXAM_QUESTIONS_PER_LEVEL,
  buildExam,
}
