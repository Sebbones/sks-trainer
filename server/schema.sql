CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT,
  password TEXT
);

INSERT INTO users (id, name, password) VALUES 
  (1, "Seb", "$2y$10$C8Ta2t1NR1oSBZDrzw24oeUG9HbsZXpNYeraTqZuwr4X1MsXFNavq"),
  (2, "finn", "$2y$10$Zplt35cLPKkdwn6oUf.TzePs5AByhTySA/TyUfkNK1ktEqmOFFVSy");

CREATE TABLE questions (
  id INT PRIMARY KEY,
  nr TEXT,
  area TEXT,
  question TEXT,
  answer TEXT
);

CREATE TABLE user_questions (
  question_id INT REFERENCES "questions" (id),
  user_id INT REFERENCES "users" (id),
  state INT,
  PRIMARY KEY (question_id, user_id)
);
