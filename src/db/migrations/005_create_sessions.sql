-- Sessions table for server-side session storage
CREATE TABLE sessions (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL,
	token VARCHAR(64) NOT NULL UNIQUE,
	expires_at TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
