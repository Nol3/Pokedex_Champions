import {
  AbilityInsight,
  AbilityResponse,
  CompetitiveMove,
  CompetitivePokemon,
  EvolutionChainResponse,
  EvolutionNodeResponse,
  EvolutionStep,
  LocalizedText,
  MoveResponse,
  PokemonOption,
  PokemonResponse,
  PokemonSpeciesResponse,
  SuggestedItem,
  TypeEffectivenessEntry,
  TypeResponse
} from "../types";
import {
  abilityRatings,
  competitiveMovePriority,
  competitiveSets,
  damageClassLabels,
  itemCatalog,
  moveMethodLabels,
  statusMoveKeywords
} from "../data/pokemonData";

const API_BASE = "https://pokeapi.co/api/v2";
const CACHE_PREFIX = "competitive-dex:v3:";
const INDEX_CACHE_KEY = "competitive-dex:v3:index";
const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
const EMPTY_ART =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se ha podido cargar ese Pokemon.");
  }
  return response.json() as Promise<T>;
}

function getEvolutionId(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  return trimmed.split("/").pop() ?? "";
}

function prettifyName(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localized(es: string, en: string): LocalizedText {
  return { es, en };
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function getFlavorByLanguage(
  entries: Array<{ language: { name: string }; flavor_text?: string; short_effect?: string }>,
  language: "es" | "en"
): string {
  const entry = entries.find((item) => item.language.name === language);
  return (entry?.flavor_text ?? entry?.short_effect ?? "").replace(/\f|\n|\r/g, " ").trim();
}

function getLocalizedFlavor(
  entries: Array<{ language: { name: string }; flavor_text?: string; short_effect?: string }>,
  fallback: LocalizedText
): LocalizedText {
  const spanish = getFlavorByLanguage(entries, "es");
  const english = getFlavorByLanguage(entries, "en");

  return {
    es: spanish || english || fallback.es,
    en: english || spanish || fallback.en
  };
}

function getRole(stats: CompetitivePokemon["stats"]): LocalizedText {
  const map = Object.fromEntries(stats.map((stat) => [stat.name, stat.value]));

  if (map.speed >= 105 && (map.attack >= 100 || map["special-attack"] >= 100)) {
    return localized("Sweeper", "Sweeper");
  }

  if (map.hp >= 90 && (map.defense >= 100 || map["special-defense"] >= 100)) {
    return localized("Tanque", "Tank");
  }

  if (map["special-attack"] >= 110 && map.speed >= 85) {
    return localized("Wallbreaker especial", "Special wallbreaker");
  }

  if (map.attack >= 110 && map.speed >= 75) {
    return localized("Wallbreaker fisico", "Physical wallbreaker");
  }

  return localized("Balance", "Balanced");
}

function getSuggestedItems(stats: CompetitivePokemon["stats"], role: LocalizedText): SuggestedItem[] {
  const map = Object.fromEntries(stats.map((stat) => [stat.name, stat.value]));
  const rawItems: Array<{ name: string; slug: string; reason: { es: string; en: string } }> = [];

  if (map.attack >= map["special-attack"]) {
    rawItems.push(...itemCatalog.offensePhysical);
  } else {
    rawItems.push(...itemCatalog.offenseSpecial);
  }

  if (map.speed >= 95) {
    rawItems.push(...itemCatalog.speedControl);
  }

  if (role.en === "Tank" || map.hp >= 90) {
    rawItems.push(...itemCatalog.bulky);
  } else {
    rawItems.push(...itemCatalog.utility);
  }

  return rawItems.slice(0, 3).map((item) => ({
    name: item.name,
    slug: item.slug,
    imageUrl: `${ITEM_SPRITE_BASE}/${item.slug}.png`,
    reason: item.reason
  }));
}

function getTriggerLabel(details: EvolutionNodeResponse["evolution_details"]): string | undefined {
  const detail = details[0];
  if (!detail) {
    return undefined;
  }

  if (detail.min_level) {
    return `Lv. ${detail.min_level}`;
  }

  if (detail.item) {
    return prettifyName(detail.item.name);
  }

  if (detail.trigger?.name) {
    return prettifyName(detail.trigger.name);
  }

  return undefined;
}

function buildEvolutionLines(node: EvolutionNodeResponse, prefix: EvolutionStep[] = []): EvolutionStep[][] {
  const current: EvolutionStep = {
    name: prettifyName(node.species.name),
    slug: node.species.name,
    triggerLabel: getTriggerLabel(node.evolution_details)
  };

  const nextPrefix = [...prefix, current];
  if (node.evolves_to.length === 0) {
    return [nextPrefix];
  }

  return node.evolves_to.flatMap((child) => buildEvolutionLines(child, nextPrefix));
}

async function getPokemonArtwork(slug: string): Promise<string> {
  try {
    const pokemon = await fetchJson<PokemonResponse>(`${API_BASE}/pokemon/${slug}`);
    return pokemon.sprites.other["official-artwork"].front_default ?? EMPTY_ART;
  } catch {
    return EMPTY_ART;
  }
}

async function getMegaForms(species: PokemonSpeciesResponse) {
  const megaEntries = species.varieties.filter((entry) => entry.pokemon.name.includes("-mega"));
  const artworks = await Promise.all(
    megaEntries.map(async (entry) => ({
      slug: entry.pokemon.name,
      name: prettifyName(entry.pokemon.name),
      artwork: await getPokemonArtwork(entry.pokemon.name)
    }))
  );

  return artworks;
}

function getMoveMethod(move: PokemonResponse["moves"][number]): LocalizedText {
  const preferred =
    move.version_group_details.find((detail) => detail.move_learn_method.name === "level-up") ??
    move.version_group_details.find((detail) => detail.move_learn_method.name === "machine") ??
    move.version_group_details[0];

  if (!preferred) {
    return localized("Desconocido", "Unknown");
  }

  if (preferred.move_learn_method.name === "level-up") {
    return preferred.level_learned_at > 0
      ? localized(`Nivel ${preferred.level_learned_at}`, `Level ${preferred.level_learned_at}`)
      : localized("Subida de nivel", "Level-up");
  }

  return (
    moveMethodLabels[preferred.move_learn_method.name] ??
    localized(prettifyName(preferred.move_learn_method.name), prettifyName(preferred.move_learn_method.name))
  );
}

function categorizeMove(name: string, pokemonTypes: string[]): CompetitiveMove["category"] {
  if (statusMoveKeywords.some((keyword) => name.includes(keyword))) {
    return "status";
  }

  if (pokemonTypes.some((type) => name.includes(type))) {
    return "stab";
  }

  return "coverage";
}

function getCandidateMoves(pokemon: PokemonResponse): Array<{ slug: string; category: CompetitiveMove["category"]; method: LocalizedText }> {
  const availableMoves = new Map(pokemon.moves.map((move) => [move.move.name, move]));
  const pokemonTypes = pokemon.types.map((entry) => entry.type.name);

  // Check embedded competitive sets (exact slug, then strip mega suffix)
  const megaBase = pokemon.name.includes("-mega") ? pokemon.name.substring(0, pokemon.name.indexOf("-mega")) : null;
  const setData = competitiveSets[pokemon.name] ?? (megaBase ? competitiveSets[megaBase] : undefined);

  if (setData) {
    const allSetMoves = [...setData.setA, ...(setData.setB ?? [])];
    const verified = allSetMoves
      .filter((slug) => availableMoves.has(slug) || true) // include even if PokeAPI doesn't list (cross-gen)
      .slice(0, 8);

    if (verified.length >= 4) {
      return verified.map((slug) => ({
        slug,
        category: categorizeMove(slug, pokemonTypes),
        method: availableMoves.has(slug) ? getMoveMethod(availableMoves.get(slug)!) : localized("Competitivo", "Competitive")
      }));
    }
  }

  // Fallback: priority list then level-up/machine
  const prioritySelected = competitiveMovePriority
    .filter((moveName) => availableMoves.has(moveName))
    .slice(0, 8)
    .map((moveName) => ({
      slug: moveName,
      category: categorizeMove(moveName, pokemonTypes),
      method: getMoveMethod(availableMoves.get(moveName)!)
    }));

  const selectedSlugs = new Set(prioritySelected.map((m) => m.slug));

  if (prioritySelected.length >= 8) return prioritySelected;

  const fallback = pokemon.moves
    .filter((move) => !selectedSlugs.has(move.move.name))
    .filter((move) =>
      move.version_group_details.some((detail) =>
        ["level-up", "machine"].includes(detail.move_learn_method.name)
      )
    )
    .sort((a, b) => {
      const aLevelUp = a.version_group_details.some((d) => d.move_learn_method.name === "level-up");
      const bLevelUp = b.version_group_details.some((d) => d.move_learn_method.name === "level-up");
      if (aLevelUp && !bLevelUp) return -1;
      if (!aLevelUp && bLevelUp) return 1;
      return 0;
    })
    .slice(0, 8 - prioritySelected.length)
    .map((move) => ({
      slug: move.move.name,
      category: categorizeMove(move.move.name, pokemonTypes),
      method: getMoveMethod(move)
    }));

  return [...prioritySelected, ...fallback];
}

async function getCompetitiveMoves(pokemon: PokemonResponse): Promise<CompetitiveMove[]> {
  const candidates = getCandidateMoves(pokemon);

  const results = await Promise.allSettled(
    candidates.map((candidate) => fetchJson<MoveResponse>(`${API_BASE}/move/${candidate.slug}`))
  );

  const moves: CompetitiveMove[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status !== "fulfilled") continue;

    const move = result.value;
    const candidate = candidates[i];
    moves.push({
      slug: move.name,
      name: prettifyName(move.name),
      type: move.type.name,
      category: candidate.category,
      damageClassTag: move.damage_class.name as "physical" | "special" | "status",
      method: candidate.method,
      power: move.power,
      accuracy: move.accuracy,
      damageClass:
        damageClassLabels[move.damage_class.name as keyof typeof damageClassLabels] ??
        localized(prettifyName(move.damage_class.name), prettifyName(move.damage_class.name)),
      description: getLocalizedFlavor(
        move.flavor_text_entries,
        localized("Sin descripcion competitiva disponible.", "No competitive description available.")
      )
    });
  }

  return moves;
}

async function getAbilityInsights(pokemon: PokemonResponse): Promise<AbilityInsight[]> {
  const results = await Promise.allSettled(
    pokemon.abilities.map((ability) =>
      fetchJson<AbilityResponse>(`${API_BASE}/ability/${ability.ability.name}`)
    )
  );

  const insights: AbilityInsight[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status !== "fulfilled") continue;

    const detail = result.value;
    const source = pokemon.abilities[i];
    insights.push({
      slug: detail.name,
      name: prettifyName(detail.name),
      isHidden: source.is_hidden,
      rating: abilityRatings[detail.name] ?? "good",
      description: getLocalizedFlavor(
        [...detail.effect_entries, ...detail.flavor_text_entries],
        localized("Sin descripcion disponible.", "No description available.")
      )
    });
  }

  return insights;
}

function normalizeSummary(species: PokemonSpeciesResponse): LocalizedText {
  return getLocalizedFlavor(
    species.flavor_text_entries,
    localized("Sin resumen disponible.", "No summary available.")
  );
}

async function getTypeEffectiveness(types: string[]) {
  const typeResponses = await Promise.all(
    types.map((type) => fetchJson<TypeResponse>(`${API_BASE}/type/${type}`))
  );
  const multipliers = new Map<string, number>();

  for (const response of typeResponses) {
    response.damage_relations.double_damage_from.forEach((entry) => {
      multipliers.set(entry.name, (multipliers.get(entry.name) ?? 1) * 2);
    });
    response.damage_relations.half_damage_from.forEach((entry) => {
      multipliers.set(entry.name, (multipliers.get(entry.name) ?? 1) * 0.5);
    });
    response.damage_relations.no_damage_from.forEach((entry) => {
      multipliers.set(entry.name, 0);
    });
  }

  const mapped = [...multipliers.entries()]
    .map(([type, multiplier]) => ({ type, multiplier }))
    .sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type));

  const select = (predicate: (value: number) => boolean): TypeEffectivenessEntry[] =>
    mapped.filter((entry) => predicate(entry.multiplier));

  return {
    weaknesses: select((value) => value > 1),
    resistances: select((value) => value > 0 && value < 1),
    immunities: select((value) => value === 0)
  };
}

async function normalizePokemon(
  pokemon: PokemonResponse,
  species: PokemonSpeciesResponse,
  evolution: EvolutionChainResponse
): Promise<CompetitivePokemon> {
  const stats = pokemon.stats.map((stat) => ({
    name: stat.stat.name,
    value: stat.base_stat
  }));
  const role = getRole(stats);

  // Detect mega form and get base form data
  const megaIndex = pokemon.name.indexOf("-mega");
  const isMega = megaIndex !== -1;
  const baseFormSlug = isMega ? pokemon.name.substring(0, megaIndex) : undefined;

  const [abilities, moves, megaForms, typeEffectiveness, baseFormArtwork] = await Promise.all([
    getAbilityInsights(pokemon),
    getCompetitiveMoves(pokemon),
    getMegaForms(species),
    getTypeEffectiveness(pokemon.types.map((entry) => entry.type.name)),
    baseFormSlug ? getPokemonArtwork(baseFormSlug) : Promise.resolve(undefined)
  ]);

  return {
    id: pokemon.id,
    name: prettifyName(pokemon.name),
    slug: pokemon.name,
    artwork: pokemon.sprites.other["official-artwork"].front_default ?? EMPTY_ART,
    baseFormSlug,
    baseFormArtwork,
    summary: normalizeSummary(species),
    types: pokemon.types.map((entry) => entry.type.name),
    stats,
    abilities,
    role,
    moves,
    items: getSuggestedItems(stats, role),
    evolutionLines: buildEvolutionLines(evolution.chain),
    megaForms,
    weaknesses: typeEffectiveness.weaknesses,
    resistances: typeEffectiveness.resistances,
    immunities: typeEffectiveness.immunities
  };
}

export async function getCompetitivePokemon(search: string): Promise<CompetitivePokemon> {
  const normalizedSearch = normalizeSearch(search);
  const cacheKey = `${CACHE_PREFIX}${normalizedSearch}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    return JSON.parse(cached) as CompetitivePokemon;
  }

  const pokemon = await fetchJson<PokemonResponse>(`${API_BASE}/pokemon/${normalizedSearch}`);
  const species = await fetchJson<PokemonSpeciesResponse>(pokemon.species.url);

  const evolutionId = getEvolutionId(species.evolution_chain.url);
  const evolution = await fetchJson<EvolutionChainResponse>(`${API_BASE}/evolution-chain/${evolutionId}`);
  const normalized = await normalizePokemon(pokemon, species, evolution);

  localStorage.setItem(cacheKey, JSON.stringify(normalized));
  return normalized;
}

export async function getPokemonSearchIndex(): Promise<PokemonOption[]> {
  const cached = localStorage.getItem(INDEX_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as PokemonOption[];
  }

  const response = await fetchJson<{ results: Array<{ name: string }> }>(`${API_BASE}/pokemon?limit=1400`);
  const normalized = response.results
    .filter((entry) => !entry.name.includes("-totem"))
    .map((entry) => ({
      slug: entry.name,
      name: prettifyName(entry.name)
    }));

  localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(normalized));
  return normalized;
}
