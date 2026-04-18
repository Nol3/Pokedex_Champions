import { useEffect, useMemo, useState, useCallback } from "react";
import { SearchBar } from "./components/SearchBar";
import { PokemonHero } from "./components/PokemonHero";
import { StatsPanel } from "./components/StatsPanel";
import { StatsCalculatorPanel } from "./components/StatsCalculatorPanel";
import { AbilitiesPanel } from "./components/AbilitiesPanel";
import { EvolutionChain } from "./components/EvolutionChain";
import { MovesPanel } from "./components/MovesPanel";
import { ItemsPanel } from "./components/ItemsPanel";
import { TeamSidebar } from "./components/TeamSidebar";
import { TeamSummary } from "./components/TeamSummary";
import { TypeEffectivenessPanel } from "./components/TypeEffectivenessPanel";
import { AppLanguage, CompetitivePokemon, PokemonOption, CompetitiveMove } from "./types";
import { getCompetitivePokemon, getPokemonSearchIndex } from "./utils/pokemon";

const TEAM_STORAGE_KEY = "competitive-dex:v3:team";

async function fetchMoveDetails(slug: string): Promise<CompetitiveMove | null> {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/move/${slug}`);
    if (!response.ok) return null;
    const move = await response.json();
    return {
      slug: move.name,
      name: move.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      type: move.type.name,
      category: "coverage" as const,
      damageClassTag: move.damage_class.name as "physical" | "special" | "status",
      method: { es: "Aprendido", en: "Learned" },
      power: move.power,
      accuracy: move.accuracy,
      damageClass: { es: move.damage_class.name, en: move.damage_class.name },
      description: { es: "", en: "" }
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>("es");
  const [query, setQuery] = useState("dragonite");
  const [pokemon, setPokemon] = useState<CompetitivePokemon | null>(null);
  const [searchIndex, setSearchIndex] = useState<PokemonOption[]>([]);
  const [team, setTeam] = useState<CompetitivePokemon[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [allMoves, setAllMoves] = useState<CompetitiveMove[]>([]);
  const [spDistribution, setSpDistribution] = useState<Record<string, number>>({ hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 });
  const [selectedNatureIndex, setSelectedNatureIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"main" | "team-summary">("main");

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    if (pokemon && pokemon.name.toLowerCase() === normalized) return [];
    return searchIndex
      .filter((option) => option.slug.includes(normalized.replace(/\s+/g, "-")))
      .slice(0, 7);
  }, [pokemon, query, searchIndex]);

  function generateDefaultMoveSet(pokemon: CompetitivePokemon, allMoves: CompetitiveMove[]): string[] {
    if (allMoves.length === 0) return [];
    
    const pokemonTypes = pokemon.types;
    const attackStat = pokemon.stats.find(s => s.name === "attack")?.value ?? 0;
    const spAttackStat = pokemon.stats.find(s => s.name === "special-attack")?.value ?? 0;
    const isPhysicalAttacker = attackStat >= spAttackStat;
    
    const statusMoves = ["protect", "dragon-dance", "roost", "swords-dance", "calm-mind", "nasty-plot", "tail-glow", "belly-drum", "amnesia", "curse", "will-o-wisp", "thunder-wave", "toxic", "light-screen", "reflect", "aurora-veil", "substitute", "detect", "endure", "wide-guard", "king-shield", "spikyshield", "baneful-bunker", "obstruct", "max-guard"];
    
    // 1. STAB move (physical or special based on highest attack stat)
    const stabMoves = allMoves.filter(m => 
      pokemonTypes.includes(m.type) && 
      m.power !== null && 
      (isPhysicalAttacker ? m.damageClassTag === "physical" : m.damageClassTag === "special")
    );
    const stabMove = stabMoves.length > 0 ? stabMoves[0].slug : allMoves.find(m => pokemonTypes.includes(m.type) && m.power !== null)?.slug;
    
    // 2. Coverage moves (2 moves of opposite or complementary types)
    const coverageMoves = allMoves.filter(m => 
      m.power !== null && 
      !pokemonTypes.includes(m.type) &&
      (isPhysicalAttacker ? m.damageClassTag === "physical" : m.damageClassTag === "special")
    ).slice(0, 2);
    
    // 3. Status move
    const statusMove = allMoves.find(m => statusMoves.some(s => m.slug.includes(s)))?.slug 
      ?? allMoves.find(m => m.power === null && m.damageClassTag === "status")?.slug;
    
    const moves: string[] = [];
    if (stabMove) moves.push(stabMove);
    moves.push(...coverageMoves.map(m => m.slug));
    if (statusMove && moves.length < 4) moves.push(statusMove);
    
    // Fill with any available moves if we don't have 4
    for (const m of allMoves) {
      if (moves.length >= 4) break;
      if (!moves.includes(m.slug)) moves.push(m.slug);
    }
    
    return moves.slice(0, 4);
  }
  
  async function loadPokemon(target?: string) {
    const searchValue = target ?? query;
    if (!searchValue.trim()) return;

    setIsLoading(true);
    setError("");
    setView("main");

    try {
      const result = await getCompetitivePokemon(searchValue);
      setPokemon(result);
      setQuery(result.name);
      setSelectedItem(null);
      // Por defecto seleccionar la primera habilidad no oculta
      const defaultAbility = result.abilities.find(a => !a.isHidden)?.slug ?? result.abilities[0]?.slug;
      setSelectedAbility(defaultAbility);
      setSpDistribution({ hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 });
      setSelectedNatureIndex(0);
      
      // Cargar todos los movimientos que puede aprender el Pokémon
      // Si es forma Mega, usar la forma base para los movimientos
      let baseFormSlug = result.baseFormSlug ?? searchValue.toLowerCase();
      baseFormSlug = baseFormSlug.toLowerCase().replace(/\s+/g, "-");
      
      const allMovesData: CompetitiveMove[] = [];
      const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${baseFormSlug}`);
      
      if (pokemonResponse.ok) {
        const pokemonData = await pokemonResponse.json();
        
        // Obtener TODOS los movimientos del Pokémon
        const movePromises = pokemonData.moves.map(async (m: { move: { name: string } }) => {
          const moveDetails = await fetchMoveDetails(m.move.name);
          return moveDetails;
        });
        
        const moveResults = await Promise.allSettled(movePromises);
        for (const r of moveResults) {
          if (r.status === "fulfilled" && r.value) {
            allMovesData.push(r.value);
          }
        }
        
        setAllMoves(allMovesData);
        
        // Generar set de movimientos por defecto
        const defaultMoves = generateDefaultMoveSet(result, allMovesData);
        setSelectedMoves(defaultMoves);
      }
    } catch (searchError) {
      setPokemon(null);
      setError(
        searchError instanceof Error
          ? language === "es"
            ? "No se ha podido cargar ese Pokemon."
            : "Could not load that Pokemon."
          : language === "es"
            ? "Ha ocurrido un error inesperado."
            : "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function toggleTeamSelection() {
    if (!pokemon) return;

    setTeam((current) => {
      const exists = current.some((entry) => entry.slug === pokemon.slug);
      const pokemonWithExtras = { 
        ...pokemon, 
        selectedItem, 
        selectedAbility, 
        selectedMoves,
        selectedSpDistribution: spDistribution,
        selectedNatureIndex,
        moves: pokemon.moves // Guardar movimientos completos
      };
      const next = exists
        ? current.filter((entry) => entry.slug !== pokemon.slug)
        : [...current, pokemonWithExtras].slice(0, 6);
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function removeFromTeam(slug: string) {
    setTeam((current) => {
      const next = current.filter((entry) => entry.slug !== slug);
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    const storedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
    if (storedTeam) {
      setTeam(JSON.parse(storedTeam) as CompetitivePokemon[]);
    }

    void loadPokemon("dragonite");
    void getPokemonSearchIndex().then(setSearchIndex).catch(() => {
      setSearchIndex([]);
    });
  }, []);

  const isSelected = pokemon ? team.some((entry) => entry.slug === pokemon.slug) : false;

  return (
    <main className="app-shell">
      <div className="background-orb orb-left" />
      <div className="background-orb orb-right" />

      <section className="app-frame">
        {view === "team-summary" ? (
          <TeamSummary
            team={team}
            language={language}
            onBack={() => setView("main")}
            onNavigate={loadPokemon}
          />
        ) : (
          <>
            <div className="top-row">
              <SearchBar
                value={query}
                suggestions={suggestions}
                onChange={setQuery}
                onSubmit={loadPokemon}
                language={language}
                onToggleLanguage={() => setLanguage((current) => (current === "es" ? "en" : "es"))}
                isLoading={isLoading}
              />
              <TeamSidebar
                team={team}
                currentSlug={pokemon?.slug}
                onNavigate={loadPokemon}
                onRemove={removeFromTeam}
                onViewTeam={() => setView("team-summary")}
                language={language}
              />
            </div>

            <section className="main-column">
              {error && <div className="notice notice-error">{error}</div>}
              {isLoading && (
                <div className="notice">
                  {language === "es" ? "Cargando datos competitivos..." : "Loading competitive data..."}
                </div>
              )}

              {pokemon && !isLoading && (
                <div className="dex-sheet">
                  <PokemonHero
                    pokemon={pokemon}
                    onSelect={toggleTeamSelection}
                    onNavigate={loadPokemon}
                    isSelected={isSelected}
                    language={language}
                    selectedItem={selectedItem}
                  />

                  <div className="dex-stats-calc-row">
                    <div className="dex-stats-section">
                      <StatsPanel stats={pokemon.stats} language={language} />
                    </div>
                    <div className="dex-calc-compact">
                      <StatsCalculatorPanel stats={pokemon.stats} language={language} spDistribution={spDistribution} onSpDistributionChange={setSpDistribution} selectedNatureIndex={selectedNatureIndex} onNatureIndexChange={setSelectedNatureIndex} />
                    </div>
                  </div>

                  <TypeEffectivenessPanel pokemon={pokemon} language={language} />
                  <div className="dex-body">
                    <div className="dex-col-left">
                      <AbilitiesPanel abilities={pokemon.abilities} language={language} selectedAbility={selectedAbility} onSelectAbility={setSelectedAbility} />
                      <EvolutionChain evolutionLines={pokemon.evolutionLines} megaForms={pokemon.megaForms} onNavigate={loadPokemon} language={language} />
                    </div>
                    <div className="dex-col-right">
                      <MovesPanel moves={pokemon.moves} language={language} selectedMoves={selectedMoves} onSelectMoves={setSelectedMoves} allMoves={allMoves} />
                      <ItemsPanel items={pokemon.items} language={language} selectedItem={selectedItem} onSelectItem={setSelectedItem} />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
