import { useMemo, useState, useEffect } from "react";
import { AppLanguage, CompetitivePokemon, PokemonStatName } from "../types";
import { statLabels, allNatures } from "../data/pokemonData";

interface StatsCalculatorPanelProps {
  stats: CompetitivePokemon["stats"];
  language: AppLanguage;
  spDistribution: Record<string, number>;
  onSpDistributionChange: (dist: Record<string, number>) => void;
  selectedNatureIndex: number;
  onNatureIndexChange: (index: number) => void;
}

const LEVEL = 50;
const IV = 31;
const MAX_PER_STAT = 32;
const TOTAL_SP = 66;

function getNatureMultiplier(stat: PokemonStatName, boost: string | null, drop: string | null): number {
  if (stat === "hp") return 1;
  if (boost === stat) return 1.1;
  if (drop === stat) return 0.9;
  return 1;
}

function calculateStat(baseStat: number, stat: PokemonStatName, sp: number, boost: string | null, drop: string | null) {
  if (stat === "hp") {
    return Math.floor(((2 * baseStat + IV) * LEVEL) / 100) + LEVEL + 10 + sp;
  }
  const preNature = Math.floor(((2 * baseStat + IV) * LEVEL) / 100) + 5 + sp;
  return Math.floor(preNature * getNatureMultiplier(stat, boost, drop));
}

function getNatureLabel(nature: typeof allNatures[number], language: AppLanguage): string {
  const name = language === "es" ? nature.nameEs : nature.name;
  if (!nature.boost || !nature.drop) return name;
  const boostLabel = statLabels[nature.boost as PokemonStatName]?.[language] ?? nature.boost;
  const dropLabel = statLabels[nature.drop as PokemonStatName]?.[language] ?? nature.drop;
  return `${name} (+${boostLabel} / -${dropLabel})`;
}

export function StatsCalculatorPanel({ stats, language, spDistribution, onSpDistributionChange, selectedNatureIndex, onNatureIndexChange }: StatsCalculatorPanelProps) {
  const totalSpent = Object.values(spDistribution).reduce((sum, v) => sum + v, 0);
  const remaining = TOTAL_SP - totalSpent;
  const selectedNature = allNatures[selectedNatureIndex];

  const totals = useMemo(
    () => stats.map((stat) => ({
      ...stat,
      sp: spDistribution[stat.name] || 0,
      total: calculateStat(stat.value, stat.name, spDistribution[stat.name] || 0, selectedNature.boost, selectedNature.drop)
    })),
    [selectedNature, spDistribution, stats]
  );

  function handleSliderChange(statName: PokemonStatName, nextValue: number) {
    const currentSpent = Object.values(spDistribution).reduce((sum, v) => sum + v, 0);
    const next = { ...spDistribution };
    const maxAllowed = Math.min(
      MAX_PER_STAT,
      (spDistribution[statName] || 0) + TOTAL_SP - currentSpent
    );
    next[statName] = Math.min(nextValue, maxAllowed);
    onSpDistributionChange(next);
  }

  return (
    <>
      <div className="sp-grid">
        <div className="sp-row sp-row-header">
          <div className="sp-header">
            <div className="sp-header-left">
              <p className="calculator-note">
                {language === "es" ? "IVs 31 · 66 SP total" : "31 IVs · 66 SP total"}
              </p>
              <span className="calculator-footer">
                {language === "es" ? `SP restantes: ${remaining}` : `Remaining SP: ${remaining}`}
              </span>
            </div>
            <label className="nature-select-wrap">
              <select value={selectedNatureIndex} onChange={(e) => onNatureIndexChange(Number(e.target.value))} className="nature-select">
                {allNatures.map((nature, i) => (
                  <option key={nature.name} value={i}>{getNatureLabel(nature, language)}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {totals.map((stat) => {
          const boost = selectedNature.boost === stat.name;
          const drop = selectedNature.drop === stat.name;
          return (
            <div key={stat.name} className="sp-row">
              <div className="sp-label">
                <strong className={boost ? "nature-boost" : drop ? "nature-drop" : ""}>
                  {statLabels[stat.name][language]}{boost && " ▲"}{drop && " ▼"}
                </strong>
                <span>Base {stat.value}</span>
              </div>
              <input
                type="range" min={0} max={MAX_PER_STAT} value={stat.sp}
                onChange={(e) => handleSliderChange(stat.name, Number(e.target.value))}
                className="sp-slider"
              />
              <div className="sp-values">
                <span>SP {stat.sp}</span>
                <strong>{stat.total}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
