export type PokemonStatName =
  | "hp"
  | "attack"
  | "defense"
  | "special-attack"
  | "special-defense"
  | "speed";

export type AppLanguage = "es" | "en";

export interface LocalizedText {
  es: string;
  en: string;
}

export interface PokemonResponse {
  id: number;
  name: string;
  species: {
    name: string;
    url: string;
  };
  sprites: {
    other: {
      "official-artwork": {
        front_default: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: { name: string };
  }>;
  stats: Array<{
    base_stat: number;
    stat: { name: PokemonStatName };
  }>;
  abilities: Array<{
    is_hidden: boolean;
    ability: { name: string };
  }>;
  moves: Array<{
    move: { name: string };
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: { name: string };
      version_group: { name: string };
    }>;
  }>;
}

export interface PokemonSpeciesResponse {
  evolution_chain: {
    url: string;
  };
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  varieties: Array<{
    is_default: boolean;
    pokemon: {
      name: string;
      url: string;
    };
  }>;
}

export interface EvolutionChainResponse {
  chain: EvolutionNodeResponse;
}

export interface EvolutionNodeResponse {
  species: {
    name: string;
  };
  evolution_details: Array<{
    min_level: number | null;
    item: { name: string } | null;
    trigger: { name: string } | null;
  }>;
  evolves_to: EvolutionNodeResponse[];
}

export interface EvolutionStep {
  name: string;
  slug: string;
  triggerLabel?: string;
}

export interface MegaForm {
  name: string;
  slug: string;
  artwork?: string;
}

export interface CompetitiveMove {
  slug: string;
  name: string;
  type: string;
  category: "stab" | "coverage" | "status";
  damageClassTag: "physical" | "special" | "status";
  method: LocalizedText;
  power: number | null;
  accuracy: number | null;
  damageClass: LocalizedText;
  description: LocalizedText;
}

export interface AbilityInsight {
  slug: string;
  name: string;
  isHidden: boolean;
  rating: "elite" | "good" | "niche";
  description: LocalizedText;
}

export interface SuggestedItem {
  name: string;
  slug: string;
  imageUrl: string;
  reason: LocalizedText;
}

export interface TypeEffectivenessEntry {
  type: string;
  multiplier: number;
}

export interface CompetitivePokemon {
  id: number;
  name: string;
  slug: string;
  artwork: string;
  baseFormSlug?: string;
  baseFormArtwork?: string;
  summary: LocalizedText;
  types: string[];
  stats: Array<{
    name: PokemonStatName;
    value: number;
  }>;
  abilities: AbilityInsight[];
  role: LocalizedText;
  moves: CompetitiveMove[];
  items: SuggestedItem[];
  evolutionLines: EvolutionStep[][];
  megaForms: MegaForm[];
  weaknesses: TypeEffectivenessEntry[];
  resistances: TypeEffectivenessEntry[];
  immunities: TypeEffectivenessEntry[];
  selectedItem?: string | null;
  selectedAbility?: string | null;
  selectedMoves?: string[];
  selectedSpDistribution?: Record<string, number>;
  selectedNatureIndex?: number;
}

export interface PokemonOption {
  name: string;
  slug: string;
}

export interface MoveResponse {
  name: string;
  power: number | null;
  accuracy: number | null;
  damage_class: { name: string };
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
}

export interface AbilityResponse {
  name: string;
  effect_entries: Array<{
    short_effect: string;
    language: { name: string };
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
}

export interface TypeResponse {
  name: string;
  damage_relations: {
    double_damage_from: Array<{ name: string }>;
    half_damage_from: Array<{ name: string }>;
    no_damage_from: Array<{ name: string }>;
  };
}
