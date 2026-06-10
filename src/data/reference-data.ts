export interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
  icon_url: string;
  description?: string | null;
}

export const factions: ReferenceItem[] = [
  {
    id: "5b812575-fba5-4be6-8497-02b0a61ce0e4",
    name: "Avalon",
    slug: "avalon",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/5cce9960-30d1-42b0-b1bf-9924d707cb60.webp"
  },
  {
    id: "a6cc4220-9772-43c3-ba29-b2d7e4901217",
    name: "Ekur",
    slug: "ekur",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/70393e62-ff94-48a5-ae11-71d572a13043.webp"
  },
  {
    id: "9ec4a421-c9c7-44f4-ae9e-a394f6076e0a",
    name: "Izumo",
    slug: "izumo",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/8146a70f-e9ed-4876-852d-66492365444a.webp"
  },
  {
    id: "a4304352-59af-4838-aea0-842adcc3ca9a",
    name: "Olympus",
    slug: "olympus",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/66279e97-e87e-4d14-b70e-92b8e3ba6569.webp"
  },
  {
    id: "d8de6ba8-2fdd-4794-845a-fdcf2d683c97",
    name: "Omeyocan",
    slug: "omeyocan",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/886f7c39-c428-4eda-91ec-8723e29a9b27.webp"
  },
  {
    id: "732504bd-3911-4c3a-b2dc-7243ff8aafed",
    name: "Tian",
    slug: "tian",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/1d2690ae-2ae3-464d-ae93-355293e5e343.webp"
  },
  {
    id: "7579839c-9701-4757-bb85-2cc3fb3f33ae",
    name: "Vyraj",
    slug: "vyraj",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/ffc525ba-28e8-4efc-9399-914698b5a9fc.webp"
  },
  {
    id: "a2b667e5-a96a-4caa-ac1f-3f23c38f3a74",
    name: "Aaru",
    slug: "aaru",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/be7d25e0-47b9-4089-8dce-03b6dcc352ef.webp"
  },
  {
    id: "d32504bd-3911-4c3a-b2dc-7243ff8aafed",
    name: "Asgard",
    slug: "asgard",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/images/5f048dce-2ae3-464d-ae93-355293e5e343.webp"
  }
];

export const archetypes: ReferenceItem[] = [
  {
    id: "802b2f8a-a631-4f91-b5a6-0302adc1d8c6",
    name: "Invoker",
    slug: "invoker",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/5901ae37-4d26-4345-9056-898acc527052.png",
    description: "Increase outgoing healing and turn meter boosts by 1% for each piece of cloth armor attuned"
  },
  {
    id: "32489d40-83f0-4a17-bf6a-25cb7f47ce0e",
    name: "Defender",
    slug: "defender",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/2e204502-dd21-4fbd-877e-e07e4a287382.png",
    description: "Reduce incoming damage by 1% for each piece of plate armor attuned"
  },
  {
    id: "829b3d2d-a2f3-47b9-bed2-6e440726f640",
    name: "Disruptor",
    slug: "disruptor",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/449b156a-c2c4-4104-b82a-c90c6c89c3e3.png",
    description: "Ignore 1% of enemy resistance for each piece of nightweave armor attuned"
  },
  {
    id: "7eee115d-b648-4881-88e9-000f8560f1d0",
    name: "Brawler",
    slug: "brawler",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/4e2730a5-8f6e-4415-b464-c3193b959a6d.png",
    description: "Increase all stats by 0.5% for each piece of chain armor attuned"
  },
  {
    id: "2bd8c7e5-a96a-4caa-ac1f-3f23c38f3a74",
    name: "Slayer",
    slug: "slayer",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/66932e2a-cae0-49fe-b093-e9228cf7dc70.png",
    description: "Increase on hit damage by 1% for each piece of leather armor attuned"
  }
];

export const affinities: ReferenceItem[] = [
  {
    id: "fc9d1868-e1dc-4906-9df9-a17314027eea",
    name: "Strength",
    slug: "strength",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/c644f354-5c91-4e75-8b7f-d1669110dfee.png",
    description: "30% chance to Strong Hit against Wisdom. Strong Hits increase damage by 30%."
  },
  {
    id: "3d4705ba-279c-4c37-95b9-2dfbf54a0ca2",
    name: "Wisdom",
    slug: "wisdom",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/d6dc4ee0-6dfa-4bce-8866-2a92ab50b9a0.png",
    description: "30% chance to Strong Hit against Cunning. Strong Hits increase damage by 30%."
  },
  {
    id: "84fcffc0-0628-4df5-839c-53634a8eecc5",
    name: "Eternal",
    slug: "eternal",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/d58d2d8a-af3f-46d4-993e-577a0dd0aba6.png",
    description: "Eternal heroes have a 10% chance to Strong Hit for an additional 30% damage against any affinity and can never weak hit."
  },
  {
    id: "ef9d070b-c442-4db6-9909-aee0771389c8",
    name: "Cunning",
    slug: "cunning",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/d1f929f7-9d5a-4260-949b-44e698086ed3.png",
    description: "30% chance to Strong Hit against Strength. Strong Hits increase damage by 30%."
  }
];

export const allegiances: ReferenceItem[] = [
  {
    id: "7b7505eb-267f-4245-b585-8038e404913c",
    name: "Chaos",
    slug: "chaos",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/0f46ef5c-3379-43d8-9801-d3c607426fa1.png"
  },
  {
    id: "335fc09a-49c6-428e-8ac6-3d088d23dcba",
    name: "Order",
    slug: "order",
    icon_url: "https://yawfmtkrnewpdxjdypmc.supabase.co/storage/v1/object/public/icons/a1aa318d-5f39-45f1-bd99-54768cacb424.png"
  }
];

export const getFaction = (name?: string | null) => factions.find(f => f.name.toLowerCase() === name?.toLowerCase());
export const getArchetype = (name?: string | null) => archetypes.find(a => a.name.toLowerCase() === name?.toLowerCase());
export const getAffinity = (name?: string | null) => affinities.find(a => a.name.toLowerCase() === name?.toLowerCase());
export const getAllegiance = (name?: string | null) => allegiances.find(a => a.name.toLowerCase() === name?.toLowerCase());
