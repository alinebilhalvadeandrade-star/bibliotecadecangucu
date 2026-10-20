-- Acervo inicial da biblioteca
INSERT INTO "books" ("title", "author", "genre", "year", "pages", "synopsis", "copies", "cover_color") VALUES
('Dom Casmurro', 'Machado de Assis', 'Clássicos brasileiros', 1899, 256, 'Bento Santiago revisita a juventude e o casamento com Capitu, numa narrativa marcada pela dúvida e pelo ciúme que atravessa gerações de leitores.', 3, '#2f4a3a'),
('Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Clássicos brasileiros', 1881, 240, 'Um defunto autor narra sua própria vida com ironia e melancolia, num dos romances mais inventivos da literatura brasileira.', 2, '#7a3b2e'),
('Grande Sertão: Veredas', 'João Guimarães Rosa', 'Clássicos brasileiros', 1956, 624, 'Riobaldo, ex-jagunço, conta suas andanças pelo sertão, o amor por Diadorim e o pacto que talvez tenha feito com o diabo.', 1, '#b5832a'),
('Vidas Secas', 'Graciliano Ramos', 'Clássicos brasileiros', 1938, 176, 'Fabiano, Sinhá Vitória, os dois meninos e a cachorra Baleia enfrentam a seca e a injustiça no sertão nordestino.', 2, '#c46a3c'),
('A Hora da Estrela', 'Clarice Lispector', 'Romance', 1977, 88, 'Rodrigo S.M. narra a vida de Macabéa, uma jovem nordestina no Rio de Janeiro, em uma reflexão sobre escrita, pobreza e existência.', 2, '#3d5a6c'),
('Capitães da Areia', 'Jorge Amado', 'Romance', 1937, 280, 'Um grupo de meninos de rua em Salvador vive de pequenos furtos, aventuras e solidariedade, sob o olhar atento e afetuoso de Jorge Amado.', 2, '#8c4f2b'),
('Torto Arado', 'Itamar Vieira Junior', 'Romance', 2019, 264, 'As irmãs Bibiana e Belonísia crescem no sertão baiano, unidas por um acidente de infância e pela luta por terra e dignidade.', 3, '#5b3a29'),
('O Avesso da Pele', 'Jeferson Tenório', 'Romance', 2020, 192, 'Pedro reconstrói a história do pai, professor assassinado em uma abordagem policial, numa obra sobre identidade, racismo e afeto.', 1, '#24343f'),
('Cem Anos de Solidão', 'Gabriel García Márquez', 'Literatura estrangeira', 1967, 448, 'A saga da família Buendía na mítica Macondo, entre amores, guerras e acontecimentos fantásticos ao longo de sete gerações.', 2, '#a2462f'),
('1984', 'George Orwell', 'Literatura estrangeira', 1949, 416, 'Winston Smith tenta preservar sua humanidade sob a vigilância constante do Grande Irmão, num retrato assustador do totalitarismo.', 3, '#3b3b3b'),
('Orgulho e Preconceito', 'Jane Austen', 'Literatura estrangeira', 1813, 424, 'Elizabeth Bennet e o Sr. Darcy superam primeiras impressões e diferenças sociais numa das comédias românticas mais amadas.', 2, '#6b4b6e'),
('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Infantojuvenil', 1943, 96, 'Um aviador perdido no deserto conhece um pequeno príncipe vindo de outro planeta e aprende sobre amizade, amor e o essencial.', 4, '#d29b3a'),
('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 'Infantojuvenil', 1997, 264, 'Harry descobre que é bruxo e começa seus estudos em Hogwarts, onde encontra amigos, mistérios e um passado que o persegue.', 3, '#7d2b2b'),
('O Menino do Pijama Listrado', 'John Boyne', 'Infantojuvenil', 2006, 192, 'Bruno, filho de um oficial nazista, faz amizade com um menino do outro lado de uma cerca, numa fábula comovente sobre inocência.', 1, '#4a5f73'),
('Sapiens', 'Yuval Noah Harari', 'Não ficção', 2011, 464, 'Uma breve história da humanidade, da revolução cognitiva à científica, que questiona como nos tornamos a espécie dominante.', 2, '#9a6b2f'),
('O Diário de Anne Frank', 'Anne Frank', 'Não ficção', 1947, 352, 'O diário de uma adolescente judia escondida em Amsterdã durante a ocupação nazista, um testemunho de esperança e coragem.', 2, '#5e6b3a'),
('Pequeno Manual Antirracista', 'Djamila Ribeiro', 'Não ficção', 2019, 136, 'Onze lições breves e diretas para entender as origens do racismo e como combatê-lo no cotidiano.', 2, '#b34a3a'),
('Ensaio sobre a Cegueira', 'José Saramago', 'Literatura estrangeira', 1995, 312, 'Uma epidemia de cegueira branca se espalha por uma cidade e expõe o melhor e o pior da natureza humana.', 1, '#e0d6c2');

-- Empréstimos e reservas de exemplo para o acervo não começar vazio
INSERT INTO "loans" ("book_id", "borrower_name", "borrower_email", "status", "created_at", "due_at", "expires_at")
SELECT b.id, v.borrower_name, v.borrower_email, v.status, NOW() - v.age, v.due_at, v.expires_at
FROM (VALUES
  ('Grande Sertão: Veredas', 'Mariana Souza', 'mariana@example.com', 'emprestado', INTERVAL '6 days', NOW() + INTERVAL '8 days', NULL::timestamp),
  ('O Avesso da Pele', 'Rafael Lima', 'rafael@example.com', 'emprestado', INTERVAL '12 days', NOW() + INTERVAL '2 days', NULL::timestamp),
  ('Ensaio sobre a Cegueira', 'Beatriz Alves', 'beatriz@example.com', 'emprestado', INTERVAL '3 days', NOW() + INTERVAL '11 days', NULL::timestamp),
  ('O Menino do Pijama Listrado', 'Lucas Pereira', 'lucas@example.com', 'reservado', INTERVAL '1 day', NULL::timestamp, NOW() + INTERVAL '2 days'),
  ('Torto Arado', 'Ana Costa', 'ana@example.com', 'emprestado', INTERVAL '9 days', NOW() + INTERVAL '5 days', NULL::timestamp),
  ('Torto Arado', 'João Martins', 'joao@example.com', 'emprestado', INTERVAL '2 days', NOW() + INTERVAL '12 days', NULL::timestamp),
  ('1984', 'Carla Mendes', 'carla@example.com', 'emprestado', INTERVAL '10 days', NOW() + INTERVAL '4 days', NULL::timestamp),
  ('Dom Casmurro', 'Pedro Rocha', 'pedro@example.com', 'reservado', INTERVAL '4 hours', NULL::timestamp, NOW() + INTERVAL '3 days'),
  ('Harry Potter e a Pedra Filosofal', 'Sofia Ribeiro', 'sofia@example.com', 'emprestado', INTERVAL '13 days', NOW() + INTERVAL '1 day', NULL::timestamp),
  ('Vidas Secas', 'Gustavo Nunes', 'gustavo@example.com', 'emprestado', INTERVAL '5 days', NOW() + INTERVAL '9 days', NULL::timestamp)
) AS v(title, borrower_name, borrower_email, status, age, due_at, expires_at)
JOIN "books" b ON b.title = v.title;
