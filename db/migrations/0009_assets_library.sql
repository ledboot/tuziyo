CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    source_output_id TEXT UNIQUE,
    kind TEXT NOT NULL CHECK(kind IN ('image', 'video', 'audio')),
    origin TEXT NOT NULL DEFAULT 'generated' CHECK(origin IN ('generated', 'uploaded', 'stock')),
    name TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    poster_key TEXT,
    content_type TEXT,
    width INTEGER,
    height INTEGER,
    duration_ms INTEGER,
    fps REAL,
    has_audio INTEGER,
    model TEXT,
    prompt TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    deleted_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(source_output_id) REFERENCES message_outputs(id) ON DELETE SET NULL
);

ALTER TABLE message_outputs ADD COLUMN asset_id TEXT REFERENCES assets(id);

INSERT OR IGNORE INTO assets (
    id, user_id, source_output_id, kind, origin, name, storage_key, poster_key,
    width, height, duration_ms, fps, has_audio, model, prompt, created_at, updated_at
)
SELECT
    'asset-' || mo.id,
    m.user_id,
    mo.id,
    mo.content_type,
    'generated',
    COALESCE(NULLIF(SUBSTR(m.prompt, 1, 80), ''), 'Generated ' || mo.content_type),
    COALESCE(mo.storage_key, mo.image_url),
    mo.poster_key,
    mo.width,
    mo.height,
    mo.duration_ms,
    mo.fps,
    mo.has_audio,
    m.model,
    m.prompt,
    mo.created_at,
    mo.updated_at
FROM message_outputs mo
INNER JOIN messages m ON m.id = mo.message_id
WHERE mo.status = 'completed' AND COALESCE(mo.storage_key, mo.image_url) IS NOT NULL;

UPDATE message_outputs
SET asset_id = 'asset-' || id
WHERE asset_id IS NULL
  AND EXISTS (SELECT 1 FROM assets a WHERE a.id = 'asset-' || message_outputs.id);

CREATE INDEX IF NOT EXISTS idx_assets_user_created ON assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_user_kind ON assets(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_assets_user_favorite ON assets(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_assets_source_output ON assets(source_output_id);
CREATE INDEX IF NOT EXISTS idx_message_outputs_asset_id ON message_outputs(asset_id);
