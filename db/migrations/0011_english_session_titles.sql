-- Normalize legacy default session titles without changing user-authored titles.
UPDATE sessions
SET title = 'New Session'
WHERE title IN (
    char(26032, 23545, 35805),
    char(26032, 20250, 35805)
);

-- Older databases may still have a legacy non-English column default. Convert
-- that default immediately when a caller inserts a session without a title.
CREATE TRIGGER IF NOT EXISTS trg_sessions_english_default
AFTER INSERT ON sessions
FOR EACH ROW
WHEN NEW.title IN (
    char(26032, 23545, 35805),
    char(26032, 20250, 35805)
)
BEGIN
    UPDATE sessions SET title = 'New Session' WHERE id = NEW.id;
END;
