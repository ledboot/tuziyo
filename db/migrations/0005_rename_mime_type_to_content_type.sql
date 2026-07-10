PRAGMA foreign_keys = OFF;

-- Rename column in SQLite
ALTER TABLE message_outputs RENAME COLUMN mime_type TO content_type;

-- Drop old triggers that references mime_type
DROP TRIGGER IF EXISTS trg_message_outputs_mime_type_insert;
DROP TRIGGER IF EXISTS trg_message_outputs_mime_type_update;

-- Re-create triggers for content_type
CREATE TRIGGER IF NOT EXISTS trg_message_outputs_content_type_insert
BEFORE INSERT ON message_outputs
FOR EACH ROW
WHEN NEW.content_type IS NULL
  OR NEW.content_type NOT IN ('image', 'video', 'audio')
BEGIN
    SELECT RAISE(ABORT, 'message_outputs.content_type must be image, video, or audio');
END;

CREATE TRIGGER IF NOT EXISTS trg_message_outputs_content_type_update
BEFORE UPDATE OF content_type ON message_outputs
FOR EACH ROW
WHEN NEW.content_type IS NULL
  OR NEW.content_type NOT IN ('image', 'video', 'audio')
BEGIN
    SELECT RAISE(ABORT, 'message_outputs.content_type must be image, video, or audio');
END;

PRAGMA foreign_keys = ON;
