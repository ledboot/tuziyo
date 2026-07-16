-- Move any message-level legacy image into message_outputs before removing the
-- duplicated storage column. message_outputs is the only image-record source.
INSERT OR IGNORE INTO message_outputs (
    id,
    message_id,
    output_index,
    status,
    image_url,
    content_type,
    created_at,
    updated_at
)
SELECT
    'legacy-' || m.id,
    m.id,
    0,
    'completed',
    m.image_url,
    'image',
    m.created_at,
    m.created_at
FROM messages m
WHERE m.status = 1
  AND m.image_url IS NOT NULL
  AND m.image_url != ''
  AND NOT EXISTS (
      SELECT 1
      FROM message_outputs mo
      WHERE mo.message_id = m.id
  );

UPDATE content_favorites
SET output_id = (
    SELECT mo.id
    FROM message_outputs mo
    WHERE mo.message_id = content_favorites.message_id
      AND mo.status != 'deleted'
    ORDER BY mo.output_index ASC
    LIMIT 1
)
WHERE output_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM message_outputs mo
      WHERE mo.message_id = content_favorites.message_id
        AND mo.status != 'deleted'
  );

-- Backfill the actual stored file format for messages whose provider request
-- did not expose an output_format option.
UPDATE messages
SET output_format = (
    SELECT CASE
        WHEN LOWER(mo.image_url) LIKE '%.jpeg' THEN 'jpeg'
        WHEN LOWER(mo.image_url) LIKE '%.jpg' THEN 'jpg'
        WHEN LOWER(mo.image_url) LIKE '%.png' THEN 'png'
        WHEN LOWER(mo.image_url) LIKE '%.webp' THEN 'webp'
        ELSE NULL
    END
    FROM message_outputs mo
    WHERE mo.message_id = messages.id
      AND mo.status = 'completed'
      AND mo.image_url IS NOT NULL
    ORDER BY mo.output_index ASC
    LIMIT 1
)
WHERE output_format IS NULL
  AND EXISTS (
      SELECT 1
      FROM message_outputs mo
      WHERE mo.message_id = messages.id
        AND mo.status = 'completed'
        AND mo.image_url IS NOT NULL
  );

ALTER TABLE messages DROP COLUMN image_url;
