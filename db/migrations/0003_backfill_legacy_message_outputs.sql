INSERT OR IGNORE INTO message_outputs (
    id,
    message_id,
    output_index,
    status,
    image_url,
    created_at,
    updated_at
)
SELECT
    'legacy-' || m.id,
    m.id,
    0,
    'completed',
    m.image_url,
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
SET output_id = 'legacy-' || message_id
WHERE output_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM message_outputs mo
      WHERE mo.id = 'legacy-' || content_favorites.message_id
  );

UPDATE generation_tasks
SET
    message_id = json_extract(result, '$.messageId'),
    requested_count = 1,
    completed_count = 1,
    failed_count = 0
WHERE message_id IS NULL
  AND status = 'completed'
  AND result IS NOT NULL
  AND json_valid(result)
  AND EXISTS (
      SELECT 1
      FROM messages m
      WHERE m.id = json_extract(generation_tasks.result, '$.messageId')
  );
