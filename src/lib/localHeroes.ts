export interface HeroProfile {
  name: string;
  subtitle: string | null;
  slug: string;
  rarity: number;
  description: string | null;
  lore: string | null;
  image_url: string | null;
  image_zoom: number | null;
  image_focal_x: number | null;
  image_focal_y: number | null;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    init: number;
    crit_rate: number;
    crit_dmg: number;
    res: number;
    acc: number;
  } | null;
  leader_bonus: {
    text: string;
    scope: string | null;
  } | null;
  divinity_generator: string | null;
  ascension_bonuses: { tier: number; bonus: string }[] | null;
  awakening_bonuses: { tier: number; bonus: string }[] | null;
  faction: string | null;
  archetype: string | null;
  affinity: string | null;
  allegiance: string | null;
  skills: {
    name: string;
    slug: string | null;
    skill_type: "Basic" | "Core" | "Ultimate" | "Passive";
    description: string | null;
    image_url: string | null;
    scaling_formula: string | null;
    effects: string[] | null;
    ultimate_cost: number | null;
    initial_divinity: number | null;
    awakening_level: number | null;
    awakening_bonus: string | null;
  }[];
  imprint_passive: string | null;
}

// Eagerly load all hero profile JSON files in src/data/heroes/
const heroModules = import.meta.glob<HeroProfile>('/src/data/heroes/*.json', { eager: true });

export const localHeroes: HeroProfile[] = Object.values(heroModules);

const heroMap = new Map<string, HeroProfile>(
  localHeroes.map((h) => [h.slug, h])
);

/**
 * Get all loaded local hero profiles.
 */
export function getLocalHeroes(): HeroProfile[] {
  return localHeroes;
}

/**
 * Get a single local hero profile by their slug.
 */
export function getLocalHero(slug: string): HeroProfile | undefined {
  return heroMap.get(slug);
}
