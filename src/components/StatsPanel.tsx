import { AppLanguage, CompetitivePokemon } from "../types";
import { statLabels } from "../data/pokemonData";

interface StatsPanelProps {
  stats: CompetitivePokemon["stats"];
  language: AppLanguage;
}

export function StatsPanel({ stats, language }: StatsPanelProps) {
  const sorted = [...stats].sort((a, b) => b.value - a.value);
  const highest = sorted[0]?.name;
  const lowest = sorted[sorted.length - 1]?.name;

  return (
    <div className="dex-stats">
      <div className="dex-stats-header">
        <span className="dex-stats-title">{language === "es" ? "Stats" : "Stats"}</span>
      </div>
      {stats.map((stat) => {
        const tone = stat.name === highest ? "bar-high" : stat.name === lowest ? "bar-low" : "bar-mid";
        return (
          <div key={stat.name} className="dex-stat-item">
            <span className="dex-stat-label">{statLabels[stat.name][language]}</span>
            <div className="stat-track">
              <div className={`stat-fill ${tone}`} style={{ width: `${Math.min(stat.value / 1.8, 100)}%` }} />
            </div>
            <span className="dex-stat-val">{stat.value}</span>
          </div>
        );
      })}
    </div>
  );
}
