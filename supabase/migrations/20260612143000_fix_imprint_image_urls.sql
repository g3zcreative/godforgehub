-- Fix broken imprint image URLs by replacing the legacy assets path with the active media API path
UPDATE public.imprints
SET image_url = REPLACE(image_url, 'https://godforge.gg/heroes/assets/ability/', 'https://godforge.gg/api/media/file/')
WHERE image_url LIKE 'https://godforge.gg/heroes/assets/ability/%';
