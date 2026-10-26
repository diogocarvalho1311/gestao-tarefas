ALTER TABLE sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('owner','viewer'));
CREATE TABLE viewer (id INTEGER PRIMARY KEY CHECK(id=1), password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at INTEGER NOT NULL, dataset TEXT NOT NULL DEFAULT 'demo' CHECK(dataset='demo'));
