CREATE TABLE workspace (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, data TEXT NOT NULL);
INSERT INTO workspace(id,revision,data) VALUES(1,0,'{"state":{"tasks":[],"blocks":[],"timeEntries":[],"availability":{},"reports":[],"revision":0},"trash":{},"baselines":{}}');
CREATE TABLE owner (id INTEGER PRIMARY KEY CHECK(id=1), password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE auth_attempts (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL);
