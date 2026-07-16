PRAGMA foreign_keys = OFF;

CREATE TABLE message_outputs (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    output_index INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'deleted')),
    image_url TEXT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    error TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    deleted_at INTEGER,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
    UNIQUE(message_id, output_index)
);

CREATE INDEX idx_message_outputs_message_id ON message_outputs(message_id);
CREATE INDEX idx_message_outputs_status ON message_outputs(status);

ALTER TABLE generation_tasks ADD COLUMN message_id TEXT REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE generation_tasks ADD COLUMN requested_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE generation_tasks ADD COLUMN completed_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE generation_tasks ADD COLUMN failed_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_generation_tasks_message_id ON generation_tasks(message_id);

ALTER TABLE content_favorites RENAME TO content_favorites_legacy;

CREATE TABLE content_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'image' CHECK(content_type IN ('image', 'video', 'audio')),
    message_id TEXT NOT NULL,
    output_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY(output_id) REFERENCES message_outputs(id) ON DELETE CASCADE
);

INSERT INTO content_favorites (id, user_id, content_type, message_id, created_at)
SELECT id, user_id, content_type, message_id, created_at
FROM content_favorites_legacy;

DROP TABLE content_favorites_legacy;

CREATE INDEX idx_content_favorites_user_id ON content_favorites(user_id);
CREATE INDEX idx_content_favorites_content_type ON content_favorites(content_type);
CREATE INDEX idx_content_favorites_message_id ON content_favorites(message_id);
CREATE INDEX idx_content_favorites_output_id ON content_favorites(output_id);
CREATE INDEX idx_content_favorites_created_at ON content_favorites(created_at);
CREATE UNIQUE INDEX idx_content_favorites_legacy_unique ON content_favorites(user_id, content_type, message_id) WHERE output_id IS NULL;
CREATE UNIQUE INDEX idx_content_favorites_output_unique ON content_favorites(user_id, content_type, output_id) WHERE output_id IS NOT NULL;

PRAGMA foreign_keys = ON;
