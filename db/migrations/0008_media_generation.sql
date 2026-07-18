ALTER TABLE messages ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image' CHECK(media_type IN ('image', 'video', 'audio'));
ALTER TABLE messages ADD COLUMN generation_mode TEXT CHECK(generation_mode IN ('text_to_image', 'image_to_image', 'text_to_video', 'image_to_video'));
ALTER TABLE messages ADD COLUMN duration INTEGER;
ALTER TABLE messages ADD COLUMN generate_audio INTEGER;

ALTER TABLE message_outputs ADD COLUMN storage_key TEXT;
ALTER TABLE message_outputs ADD COLUMN poster_key TEXT;
ALTER TABLE message_outputs ADD COLUMN duration_ms INTEGER;
ALTER TABLE message_outputs ADD COLUMN fps REAL;
ALTER TABLE message_outputs ADD COLUMN has_audio INTEGER;

UPDATE message_outputs
SET storage_key = image_url
WHERE storage_key IS NULL AND image_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
CREATE INDEX IF NOT EXISTS idx_message_outputs_content_type ON message_outputs(content_type);
CREATE INDEX IF NOT EXISTS idx_message_outputs_storage_key ON message_outputs(storage_key);
