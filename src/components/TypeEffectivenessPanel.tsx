import { AppLanguage, CompetitivePokemon } from "../types";
import { typeColors, typeIcons, typeLabels } from "../data/pokemonData";

interface TypeEffectivenessPanelProps {
  pokemon: CompetitivePokemon;
  language: AppLanguage;
}

function formatMultiplier(value: number) {
  if (Number.isInteger(value)) return `${value}x`;
  return `${value.toFixed(2).replace(/0$/, "").replace(/\.$/, "")}x`;
}

export function TypeEffectivenessPanel({ pokemon, language }: TypeEffectivenessPanelProps) {
  const weaknesses = pokemon.weaknesses ?? [];
  const resistances = pokemon.resistances ?? [];
  const immunities = pokemon.immunities ?? [];

  const renderPills = (entries: typeof weaknesses) =>
    entries.map((entry) => (
      <span key={entry.type} className={`type-pill type-pill-icon ${typeColors[entry.type] ?? ""}`}>
        {typeIcons[entry.type] && <img src={typeIcons[entry.type]} alt="" className="type-icon" />}
        {typeLabels[entry.type]?.[language] ?? entry.type} {formatMultiplier(entry.multiplier)}
      </span>
    ));

  return (
    <div className="dex-matchups">
      {weaknesses.length > 0 && (
        <div className="dex-matchup-row">
          <span className="dex-matchup-label">{language === "es" ? "Debilidades:" : "Weaknesses:"}</span>
          <div className="chip-list">{renderPills(weaknesses)}</div>
        </div>
      )}
      {resistances.length > 0 && (
        <div className="dex-matchup-row">
          <span className="dex-matchup-label">{language === "es" ? "Resistencias:" : "Resistances:"}</span>
          <div className="chip-list">{renderPills(resistances)}</div>
        </div>
      )}
      {immunities.length > 0 && (
        <div className="dex-matchup-row">
          <span className="dex-matchup-label">{language === "es" ? "Inmunidades:" : "Immunities:"}</span>
          <div className="chip-list">{renderPills(immunities)}</div>
        </div>
      )}
    </div>
  );
}
