CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT,
  password TEXT
);

INSERT INTO users (id, name, password) VALUES 
  (1, "Seb", "$2y$10$C8Ta2t1NR1oSBZDrzw24oeUG9HbsZXpNYeraTqZuwr4X1MsXFNavq"),
  (2, "finn", "$2y$10$Zplt35cLPKkdwn6oUf.TzePs5AByhTySA/TyUfkNK1ktEqmOFFVSy");

CREATE TABLE user_questions (
  question_area TEXT,
  question_nr TEXT,
  user_id INT REFERENCES "users" (id),
  state INT,
  PRIMARY KEY (question_area, question_nr, user_id)
);

CREATE TABLE user_test_run_stats (
  user_id INT REFERENCES "users" (id) PRIMARY KEY,
  passed_count INT,
  failed_count INT,
  oral_count INT
);
