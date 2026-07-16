-- Some provider APIs call their aspect-ratio parameter `size`. Keep the
-- provider request shape unchanged, but store ratio values in the semantic
-- messages.aspect_ratio column. Pixel dimensions remain in image_size.
UPDATE messages
SET
    aspect_ratio = COALESCE(aspect_ratio, image_size),
    image_size = NULL
WHERE image_size LIKE '%:%'
  AND image_size NOT LIKE '%:%:%';
