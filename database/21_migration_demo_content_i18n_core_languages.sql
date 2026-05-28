-- Demo content i18n for core non-JavaScript languages.
-- Adds English translations for the demo-facing lessons of Python, Java, C++, and C#,
-- plus prompt/explanation translations for their lesson solutions.

CREATE TEMPORARY TABLE demo_core_language_translation_seed (
  lesson_slug VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  content_en LONGTEXT NOT NULL,
  explanation_en TEXT NOT NULL,
  prompt_en TEXT NOT NULL
);

INSERT INTO demo_core_language_translation_seed VALUES
('python-introduccion',
'Introduction to Python',
'Variables, data types, and running your first Python script.',
'<h2>Introduction to Python</h2>
<p>Python is one of the most popular languages in the world thanks to its readability and versatility. It is used in web development, data science, automation, and artificial intelligence.</p>
<h3>Variables and basic types</h3>
<p>In Python you do not need to declare the type of a variable. The interpreter infers it automatically:</p>
<pre><code>name = "CodeQuest"   # str
age  = 25            # int
price = 9.99         # float
active = True        # bool</code></pre>
<h3>Console output</h3>
<p>The <code>print()</code> function shows values in the console. You can pass any variable or expression to it:</p>
<pre><code>print(name)              # CodeQuest
print(age + 5)           # 30
print(f"Hello, {name}!") # Hello, CodeQuest!</code></pre>
<h3>Lists and transformations</h3>
<p>Lists store ordered collections. List comprehensions let you transform them in a single line:</p>
<pre><code>numbers = [1, 2, 3]
doubles = [n * 2 for n in numbers]
print(doubles)  # [2, 4, 6]</code></pre>
<p>Practice identifying the variable name that stores the result of a transformation.</p>',
'The variable <code>doubles</code> stores the transformed list that must be printed.',
'Complete the missing identifier to print the transformed list in Python.'),

('java-clases-objetos',
'Java: classes and objects',
'Object-oriented programming in Java: classes, attributes, and methods.',
'<h2>Classes and objects in Java</h2>
<p>Java is an object-oriented language by design. All code lives inside classes, and objects are instances of those classes.</p>
<h3>Defining a class</h3>
<p>A class groups attributes (data) and methods (behavior):</p>
<pre><code>public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age  = age;
    }

    public String getName() { return this.name; }
}</code></pre>
<h3>Creating an object</h3>
<p>You use <code>new</code> to instantiate a class, and the constructor runs automatically:</p>
<pre><code>Person p = new Person("Ana", 28);
System.out.println(p.getName());  // Ana</code></pre>
<h3>Printing variables</h3>
<p>The <code>System.out.println()</code> method accepts any type of data. When you pass a String variable, it displays its content:</p>
<pre><code>String message = "Hello CodeQuest";
System.out.println(message);  // Hello CodeQuest</code></pre>
<p>Correctly identifying the variable that stores the value to print is a core debugging skill in Java.</p>',
'<code>message</code> is the variable that stores the String value that must be printed.',
'Complete the missing identifier to print the message in Java.'),

('cpp-sintaxis-esencial',
'C++: essential syntax',
'Variables, control flow, functions, and input/output in C++.',
'<h2>Essential syntax in C++</h2>
<p>C++ combines the power of C with higher-level abstractions. It is the language behind game engines, operating systems, and high-performance software.</p>
<h3>Variables and types</h3>
<p>In C++ you must declare the type of every variable. The basic types are <code>int</code>, <code>double</code>, <code>char</code>, and <code>bool</code>:</p>
<pre><code>int total = 2 + 3;
double price = 19.99;
bool active = true;</code></pre>
<h3>Output with cout</h3>
<p>The <code><<</code> operator chains values into the standard output:</p>
<pre><code>std::cout << total << std::endl;   // 5
std::cout << "Price: " << price;   // Price: 19.99</code></pre>
<h3>Control flow</h3>
<p>The <code>if/else</code> structures and <code>for</code>/<code>while</code> loops work much like they do in many other languages:</p>
<pre><code>for (int i = 0; i < 5; i++) {
    std::cout << i << " ";
}
// 0 1 2 3 4</code></pre>
<p>The key to debugging in C++ is naming your variables clearly and using them correctly with <code>cout</code>.</p>',
'<code>total</code> stores the calculated value that must be sent to <code>cout</code>.',
'Complete the missing identifier to show the result in C++.'),

('csharp-dotnet-primeros-pasos',
'C# and .NET: first steps',
'Project structure, basic types, and console output in C#.',
'<h2>First steps with C# and .NET</h2>
<p>C# is the main language of Microsoft''s .NET ecosystem. It is used for web development (ASP.NET), desktop applications (WPF/MAUI), games (Unity), and cloud services.</p>
<h3>Program structure</h3>
<p>A minimal C# program has a namespace, a class, and the static <code>Main</code> method:</p>
<pre><code>namespace MyApp {
    class Program {
        static void Main(string[] args) {
            Console.WriteLine("Hello, .NET!");
        }
    }
}</code></pre>
<h3>Variables and types</h3>
<p>C# is strongly typed but allows inference with <code>var</code>:</p>
<pre><code>int total = 2 + 3;
var message = "Result: " + total;
Console.WriteLine(message);  // Result: 5</code></pre>
<h3>Console output</h3>
<p><code>Console.WriteLine()</code> prints the value of any variable and adds a line break:</p>
<pre><code>int total = 2 + 3;
Console.WriteLine(total);  // 5</code></pre>
<p>Learn to identify the variable that stores the result of an operation: that is what you pass to <code>Console.WriteLine()</code>.</p>',
'<code>total</code> is the variable that stores the result that must be printed.',
'Complete the missing identifier to print the result in C#.');

INSERT INTO lesson_translations (lesson_id, locale, title, description, content)
SELECT l.id, 'en', seed.title_en, seed.description_en, seed.content_en
FROM demo_core_language_translation_seed seed
JOIN lessons l ON l.slug = seed.lesson_slug
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  content = VALUES(content);

INSERT INTO lesson_solution_translations (lesson_solution_id, locale, explanation, prompt)
SELECT ls.id, 'en', seed.explanation_en, seed.prompt_en
FROM demo_core_language_translation_seed seed
JOIN lessons l ON l.slug = seed.lesson_slug
JOIN lesson_solutions ls ON ls.lesson_id = l.id
ON DUPLICATE KEY UPDATE
  explanation = VALUES(explanation),
  prompt = VALUES(prompt);

DROP TEMPORARY TABLE demo_core_language_translation_seed;
