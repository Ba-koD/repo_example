CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO messages (author, text, environment)
VALUES ('db-bootstrap', 'hello from initdb', 'bootstrap');
