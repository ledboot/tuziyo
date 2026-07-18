CREATE TABLE IF NOT EXISTS studio_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    aspect_ratio TEXT NOT NULL DEFAULT '16:9',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    deleted_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_entities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'character' CHECK(type IN ('character', 'location', 'object', 'style')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(project_id) REFERENCES studio_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_entity_assets (
    entity_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY(entity_id, asset_id),
    FOREIGN KEY(entity_id) REFERENCES studio_entities(id) ON DELETE CASCADE,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_frames (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    label TEXT,
    frame_type TEXT NOT NULL DEFAULT 'reference' CHECK(frame_type IN ('reference', 'first', 'last', 'storyboard')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(project_id) REFERENCES studio_projects(id) ON DELETE CASCADE,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_shots (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    prompt TEXT,
    duration_ms INTEGER,
    first_frame_asset_id TEXT,
    last_frame_asset_id TEXT,
    active_version_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'ready', 'failed')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(project_id) REFERENCES studio_projects(id) ON DELETE CASCADE,
    FOREIGN KEY(first_frame_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY(last_frame_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS studio_shot_versions (
    id TEXT PRIMARY KEY,
    shot_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(shot_id) REFERENCES studio_shots(id) ON DELETE CASCADE,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    UNIQUE(shot_id, version_number)
);

CREATE TABLE IF NOT EXISTS studio_sequence_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    shot_id TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    transition TEXT NOT NULL DEFAULT 'cut' CHECK(transition IN ('cut', 'fade')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(project_id) REFERENCES studio_projects(id) ON DELETE CASCADE,
    FOREIGN KEY(shot_id) REFERENCES studio_shots(id) ON DELETE CASCADE,
    UNIQUE(project_id, position)
);

CREATE TABLE IF NOT EXISTS studio_render_jobs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'processing', 'completed', 'failed')),
    format TEXT NOT NULL DEFAULT 'mp4',
    output_asset_id TEXT,
    error TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(project_id) REFERENCES studio_projects(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(output_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_projects_user ON studio_projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_studio_entities_project ON studio_entities(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_frames_project ON studio_frames(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_shots_project ON studio_shots(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_studio_sequence_project ON studio_sequence_items(project_id, position);
CREATE INDEX IF NOT EXISTS idx_studio_render_jobs_project ON studio_render_jobs(project_id, created_at DESC);
