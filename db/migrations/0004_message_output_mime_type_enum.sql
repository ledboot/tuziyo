UPDATE message_outputs
SET mime_type = 'image'
WHERE mime_type IS NULL
   OR mime_type NOT IN ('image', 'video', 'audio');

CREATE TRIGGER IF NOT EXISTS trg_message_outputs_mime_type_insert
BEFORE INSERT ON message_outputs
FOR EACH ROW
WHEN NEW.mime_type IS NULL
  OR NEW.mime_type NOT IN ('image', 'video', 'audio')
BEGIN
    SELECT RAISE(ABORT, 'message_outputs.mime_type must be image, video, or audio');
END;

CREATE TRIGGER IF NOT EXISTS trg_message_outputs_mime_type_update
BEFORE UPDATE OF mime_type ON message_outputs
FOR EACH ROW
WHEN NEW.mime_type IS NULL
  OR NEW.mime_type NOT IN ('image', 'video', 'audio')
BEGIN
    SELECT RAISE(ABORT, 'message_outputs.mime_type must be image, video, or audio');
END;
