-- Demo path i18n for core non-JavaScript languages.
-- Adds English translations for the learning paths shown as modules/cards
-- for Python, Java, C++, and C#.

CREATE TEMPORARY TABLE demo_core_path_translation_seed (
  path_slug VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL
);

INSERT INTO demo_core_path_translation_seed VALUES
('python-basics',
'Python from Scratch',
'Learn Python from the fundamentals up to intermediate concepts.'),

('python-intermediate',
'Intermediate Python',
'Master data structures and algorithms in Python.'),

('java-fundamentals',
'Java Fundamentals',
'Introduction to Java and object-oriented programming.'),

('cpp-basics',
'C++ for Beginners',
'Learn C++ from scratch with practical exercises.'),

('csharp-dotnet',
'C# and .NET',
'Application development with C# and .NET.');

INSERT INTO learning_path_translations (learning_path_id, locale, name, description)
SELECT lp.id, 'en', seed.name_en, seed.description_en
FROM demo_core_path_translation_seed seed
JOIN learning_paths lp ON lp.slug = seed.path_slug
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

DROP TEMPORARY TABLE demo_core_path_translation_seed;
