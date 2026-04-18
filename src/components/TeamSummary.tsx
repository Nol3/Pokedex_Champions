import { AppLanguage, CompetitivePokemon } from "../types";
import { typeColors, typeIcons, typeLabels, statLabels, allNatures } from "../data/pokemonData";
import { t } from "../utils/i18n";

interface TeamSummaryProps {
  team: CompetitivePokemon[];
  language: AppLanguage;
  onBack: () => void;
  onNavigate: (slug: string) => void;
}

const LEVEL = 50;
const IV = 31;

function calculateStat(baseStat: number, statName: string, sp: number, natureIndex: number): number {
  const nature = allNatures[natureIndex];
  const boost = nature.boost === statName;
  const drop = nature.drop === statName;
  
  let multiplier = 1;
  if (boost) multiplier = 1.1;
  if (drop) multiplier = 0.9;
  
  if (statName === "hp") {
    return Math.floor(((2 * baseStat + IV) * LEVEL) / 100) + LEVEL + 10 + sp;
  }
  const preNature = Math.floor(((2 * baseStat + IV) * LEVEL) / 100) + 5 + sp;
  return Math.floor(preNature * multiplier);
}

function generatePokePaste(pokemon: CompetitivePokemon, language: AppLanguage): string {
  const lines: string[] = [];
  
  // Primera línea: Nombre @ Item
  const item = pokemon.selectedItem ? pokemon.selectedItem.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "";
  lines.push(item ? `${pokemon.name} @ ${item}` : pokemon.name);
  
  // Ability
  const ability = pokemon.selectedAbility 
    ? pokemon.abilities.find(a => a.slug === pokemon.selectedAbility)?.name 
    : pokemon.abilities[0]?.name;
  if (ability) {
    lines.push(`Ability: ${ability}`);
  }
  
  // EVs
  const spDist = pokemon.selectedSpDistribution || { hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 };
  const natureIndex = pokemon.selectedNatureIndex || 0;
  const nature = allNatures[natureIndex];
  
  const evParts: string[] = [];
  if (spDist.hp > 0) evParts.push(`${spDist.hp} HP`);
  if (spDist.attack > 0) evParts.push(`${spDist.attack} Atk`);
  if (spDist.defense > 0) evParts.push(`${spDist.defense} Def`);
  if (spDist["special-attack"] > 0) evParts.push(`${spDist["special-attack"]} SpA`);
  if (spDist["special-defense"] > 0) evParts.push(`${spDist["special-defense"]} SpD`);
  if (spDist.speed > 0) evParts.push(`${spDist.speed} Spe`);
  
  if (evParts.length > 0) {
    lines.push(`EVs: ${evParts.join(" / ")}`);
  }
  
  // Nature - usar nombre en inglés siempre para PokePaste
  lines.push(nature.name);
  
  // Movimientos - simplificar
  const moves = pokemon.selectedMoves || [];
  if (moves.length > 0) {
    moves.forEach(moveSlug => {
      // Buscar en moves del pokemon guardado
      let move = pokemon.moves?.find(m => m.slug === moveSlug);
      
      // Si no encuentra, buscar de otra forma
      if (!move && pokemon.moves) {
        move = pokemon.moves.find(m => 
          m.slug === moveSlug ||
          m.slug.replace(/-/g, "") === moveSlug.replace(/-/g, "") ||
          moveSlug.includes(m.slug.split("-")[0])
        );
      }
      
      if (move) {
        lines.push(`- ${move.name}`);
      } else {
        // Último recurso: formatear el slug como nombre
        const prettyName = moveSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        lines.push(`- ${prettyName}`);
      }
    });
  }
  
  return lines.join("\n");
}

export function TeamSummary({ team, language, onBack, onNavigate }: TeamSummaryProps) {
  const pokePasteText = team.map(p => generatePokePaste(p, language)).join("\n\n");
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(pokePasteText);
  };

  return (
    <div className="team-summary">
      <div className="team-summary-header">
        <button type="button" className="back-button" onClick={onBack}>
          {language === "es" ? "← Volver" : "← Back"}
        </button>
        <div>
          <p className="eyebrow">{language === "es" ? "Resumen de equipo" : "Team overview"}</p>
          <h2>{language === "es" ? "Mi Equipo Competitivo" : "My Competitive Team"}</h2>
        </div>
      </div>

      <div className="pokepaste-container">
        <div className="pokepaste-header">
          <button type="button" className="copy-button" onClick={copyToClipboard}>
            {language === "es" ? "📋 Copiar" : "📋 Copy"}
          </button>
        </div>
        <pre className="pokepaste-text">{pokePasteText}</pre>
      </div>

      <div className="team-summary-grid">
        {team.map((pokemon) => {
          const topItem = pokemon.items?.[0];
          
          // Calcular stats finales con SP distribuidos
          const spDist = pokemon.selectedSpDistribution || { hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 };
          const natureIndex = pokemon.selectedNatureIndex || 0;
          
          const calculatedStats = pokemon.stats.map(stat => ({
            ...stat,
            final: calculateStat(stat.value, stat.name, spDist[stat.name] || 0, natureIndex)
          }));
          
          const statMax = Math.max(...calculatedStats.map(s => s.final));

          return (
            <article key={pokemon.slug} className="team-summary-card card">
              <div className="tsc-top">
                <img
                  src={pokemon.artwork}
                  alt={pokemon.name}
                  className="tsc-artwork"
                  onClick={() => onNavigate(pokemon.slug)}
                  style={{ cursor: "pointer" }}
                />
                <div className="tsc-info">
                  <h3 className="tsc-name">{pokemon.name}</h3>
                  <p className="tsc-role">{t(pokemon.role, language)}</p>
                  <div className="type-list">
                    {pokemon.types.map((type) => (
                      <span key={type} className={`type-pill type-pill-icon ${typeColors[type] ?? ""}`} style={{ fontSize: "0.7rem", padding: "4px 7px" }}>
                        {typeIcons[type] && <img src={typeIcons[type]} alt="" className="type-icon" style={{ width: "14px", height: "14px" }} />}
                        {typeLabels[type]?.[language] ?? type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tsc-stats">
                {calculatedStats.map((stat) => (
                  <div key={stat.name} className="tsc-stat-row">
                    <span className="tsc-stat-label">{statLabels[stat.name][language]}</span>
                    <div className="stat-track tsc-track">
                      <div
                        className={`stat-fill ${stat.final >= 100 ? "bar-high" : stat.final >= 65 ? "bar-mid" : "bar-low"}`}
                        style={{ width: `${Math.min((stat.final / statMax) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="tsc-stat-val">{stat.final}</span>
                  </div>
                ))}
              </div>

              {pokemon.moves && pokemon.moves.length > 0 && (
                <div className="tsc-moves">
                  <p className="tsc-section-label">{language === "es" ? "Movimientos" : "Moves"}</p>
                  <div className="tsc-moves-list">
                    {(pokemon.selectedMoves?.length > 0 ? pokemon.selectedMoves : pokemon.moves.slice(0, 4).map(m => m.slug)).map((moveSlug, idx) => {
                      const move = pokemon.moves?.find(m => m.slug === moveSlug) 
                        || pokemon.moves?.find(m => m.slug.includes(moveSlug) || moveSlug.includes(m.slug));
                      return move ? (
                        <span key={`${moveSlug}-${idx}`} className={`tsc-move-tag move-tag move-${move.category}`}>
                          {move.name}
                        </span>
                      ) : (
                        <span key={`${moveSlug}-${idx}`} className="tsc-move-tag move-tag">{moveSlug}</span>
                      );
                    })}
                  </div>
                </div>
              )}

              {topItem && (
                <div className="tsc-item">
                  {pokemon.selectedItem ? (
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${pokemon.selectedItem}.png`}
                      alt=""
                      className="tsc-item-icon"
                    />
                  ) : (
                    <img
                      src={topItem.imageUrl}
                      alt={topItem.name}
                      className="tsc-item-icon"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <span>{pokemon.selectedItem ? pokemon.selectedItem : topItem.name}</span>
                </div>
              )}

              {pokemon.selectedAbility && (
                <div className="tsc-ability">
                  <span className="tsc-ability-label">{language === "es" ? "Habilidad:" : "Ability:"}</span>
                  <span>{pokemon.abilities.find(a => a.slug === pokemon.selectedAbility)?.name ?? pokemon.selectedAbility}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
