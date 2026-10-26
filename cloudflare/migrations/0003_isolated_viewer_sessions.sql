-- Older deployments authenticate against sessions without checking a role.
-- Visitor tokens must never be stored in that legacy table.
CREATE TABLE viewer_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer' CHECK(role='viewer'));
CREATE INDEX viewer_sessions_expiry ON viewer_sessions(expires_at);
ALTER TABLE viewer RENAME TO viewer_access;
DELETE FROM sessions WHERE role='viewer';
