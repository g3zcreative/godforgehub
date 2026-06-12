-- Seed default SEO templates for entities
INSERT INTO public.seo_templates (entity_type, title_template, description_template)
VALUES
  (
    'hero',
    '{name} Guide, Builds & Review - Godforge',
    'Get the ultimate {name} guide, builds, and review for Godforge. Check out {name}''s skills, imprints, stats, and team synergies. Updated for the latest patch.'
  ),
  (
    'weapon',
    '{name} Weapon Guide & Stats - Godforge',
    'Complete weapon guide for {name} in Godforge. Check out stats, weapon passive, linked imprints, and best heroes.'
  ),
  (
    'imprint',
    '{name} Imprint Guide & Stats - Godforge',
    'Complete imprint guide for {name} in Godforge. Learn about the passive effects, linked weapons, and best hero builds.'
  ),
  (
    'skill',
    '{name} Skill Info & Scaling - Godforge',
    'Detailed breakdown of the {name} skill in Godforge, including skill type, scaling formula, awakening effects, and upgrades.'
  )
ON CONFLICT (entity_type) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  description_template = EXCLUDED.description_template,
  updated_at = now();
