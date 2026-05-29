-- Fix advanced Ruby and Go curriculum gaps caused by unique path order collisions in the previous migration.

START TRANSACTION;

CREATE TEMPORARY TABLE curriculum_gap_fix (
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

INSERT INTO curriculum_gap_fix (
  path_slug, title, slug, description, content, order_position, estimated_minutes, xp_reward,
  solution_code, explanation, prompt, base_code, title_en, description_en, content_en, explanation_en, prompt_en
) VALUES
('ruby-advanced', 'Fiber Scheduler y tareas cooperativas', 'ruby-fiber-scheduler', 'Explora el modelo cooperativo moderno de Ruby para operaciones de E/S sin bloquear todo el proceso.', '<h2>Fiber Scheduler</h2><p>Ademas de threads y Ractors, Ruby moderno puede coordinar tareas cooperativas con Fibers y un scheduler orientado a operaciones de E/S.</p><pre><code>fiber = Fiber.new { Fiber.yield("pausa") }; puts fiber.resume</code></pre>', 6, 28, 80, 'yield', 'La llamada <code>Fiber.yield</code> cede el control temporalmente y devuelve un valor al reanudar.', 'Completa la instruccion que pausa la Fiber y devuelve el mensaje inicial.', 'fiber = Fiber.new { Fiber._____("pausa") }; puts fiber.resume', 'Fiber Scheduler and cooperative tasks', 'Explore Ruby''s modern cooperative model for I/O-heavy work without blocking the whole process.', '<h2>Fiber Scheduler</h2><p>Alongside threads and Ractors, modern Ruby can coordinate cooperative tasks with Fibers and a scheduler centered on I/O operations.</p><pre><code>fiber = Fiber.new { Fiber.yield("pause") }; puts fiber.resume</code></pre>', 'The <code>Fiber.yield</code> call temporarily transfers control and returns a value when resumed.', 'Complete the instruction that pauses the Fiber and returns the initial message.'),
('ruby-advanced', 'HTTP, JSON y servicios modernos', 'ruby-http-json-servicios', 'Prepara Ruby para integrarse con APIs, procesar respuestas y mover datos entre servicios.', '<h2>HTTP, JSON y servicios</h2><p>Ruby tambien participa en integraciones, clientes HTTP y microservicios. Un flujo comun es recibir JSON, parsearlo y reaccionar segun el contenido.</p><pre><code>require "json"; datos = JSON.parse("{\"ok\":true}"); puts datos["ok"]</code></pre>', 7, 28, 80, 'parse', 'Usa <code>JSON.parse</code> para convertir una cadena JSON en una estructura Ruby navegable.', 'Completa la llamada que transforma la respuesta JSON en un hash Ruby.', 'require "json"; respuesta = "{\"ok\":true}"; datos = JSON._____(respuesta); puts datos["ok"]', 'HTTP, JSON, and modern services', 'Prepare Ruby to integrate with APIs, process responses, and move data between services.', '<h2>HTTP, JSON, and services</h2><p>Ruby also fits integrations, HTTP clients, and microservices. A common flow is to receive JSON, parse it, and react based on its contents.</p><pre><code>require "json"; data = JSON.parse("{\"ok\":true}"); puts data["ok"]</code></pre>', 'Use <code>JSON.parse</code> to convert a JSON string into a navigable Ruby structure.', 'Complete the call that transforms the JSON response into a Ruby hash.'),
('go-advanced', 'Testing, subtests y benchmarks', 'go-testing-benchmarks', 'Aprende a validar comportamiento, organizar escenarios y medir rendimiento sin salir de la herramienta oficial.', '<h2>Testing en Go</h2><p>Go integra pruebas en su flujo normal de trabajo mediante el paquete <code>testing</code>. Puedes crear pruebas unitarias, agrupar escenarios con subtests y medir rendimiento con benchmarks.</p><pre><code>func TestLogin(t *testing.T) { t.Run("valido", func(t *testing.T) {}) }</code></pre>', 7, 28, 80, 'Run', 'El metodo <code>t.Run</code> crea un subtest con nombre propio dentro de la prueba principal.', 'Completa la llamada que crea el subtest llamado "valido".', 'package ejemplo; import "testing"; func TestLogin(t *testing.T) { t._____("valido", func(t *testing.T) {}) }', 'Testing, subtests, and benchmarks', 'Learn to validate behavior, organize scenarios, and measure performance with Go''s official tooling.', '<h2>Testing in Go</h2><p>Go integrates testing into the everyday workflow through the <code>testing</code> package. You can write unit tests, group scenarios with subtests, and measure performance with benchmarks.</p><pre><code>func TestLogin(t *testing.T) { t.Run("valid", func(t *testing.T) {}) }</code></pre>', 'The <code>t.Run</code> method creates a named subtest within the main test.', 'Complete the call that creates the subtest named "valido".');

INSERT INTO lessons (learning_path_id, title, slug, description, content, order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward)
SELECT lp.id, seed.title, seed.slug, seed.description, seed.content, seed.order_position, seed.estimated_minutes, 1, 0, 0, seed.xp_reward
FROM curriculum_gap_fix seed
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
FROM curriculum_gap_fix seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), content = VALUES(content);

INSERT INTO lesson_solutions (lesson_id, language_id, solution_code, explanation, prompt, base_code)
SELECT l.id, pl.id, seed.solution_code, seed.explanation, seed.prompt, seed.base_code
FROM curriculum_gap_fix seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN programming_languages pl ON pl.id = lp.programming_language_id
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
ON DUPLICATE KEY UPDATE language_id = VALUES(language_id), solution_code = VALUES(solution_code), explanation = VALUES(explanation), prompt = VALUES(prompt), base_code = VALUES(base_code);

INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM curriculum_gap_fix seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug
JOIN lesson_solutions ls ON ls.lesson_id = l.id
ON DUPLICATE KEY UPDATE explanation = VALUES(explanation), prompt = VALUES(prompt);

DELETE ltc FROM lesson_test_cases ltc JOIN lessons l ON l.id = ltc.lesson_id JOIN curriculum_gap_fix seed ON seed.slug = l.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'Verifica el concepto tecnico descrito en la leccion.', 0, 10, 1
FROM curriculum_gap_fix seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

INSERT INTO lesson_test_cases (lesson_id, input_data, expected_output, is_hidden, points, order_position)
SELECT l.id, '', 'El codigo debe conservar sintaxis valida y una salida coherente.', 1, 10, 2
FROM curriculum_gap_fix seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
JOIN lessons l ON l.learning_path_id = lp.id AND l.slug = seed.slug;

DROP TEMPORARY TABLE curriculum_gap_fix;

COMMIT;