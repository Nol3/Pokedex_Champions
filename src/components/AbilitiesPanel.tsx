import { useState } from "react";
import { AppLanguage, CompetitivePokemon } from "../types";
import { t } from "../utils/i18n";

interface AbilitiesPanelProps {
  abilities: CompetitivePokemon["abilities"];
  language: AppLanguage;
  selectedAbility: string | null;
  onSelectAbility: (slug: string | null) => void;
}

const ratingLabel = {
  elite: { es: "Meta", en: "Meta" },
  good: { es: "Útil", en: "Useful" },
  niche: { es: "Situacional", en: "Niche" }
} as const;

export function AbilitiesPanel({ abilities, language, selectedAbility, onSelectAbility }: AbilitiesPanelProps) {
  const safeAbilities = abilities ?? [];

  return (
    <div className="dex-section">
      <p className="dex-section-title">{language === "es" ? "Habilidad" : "Ability"}</p>
      
      {selectedAbility && (
        <div className="dex-ability-selected">
          <span className="dex-ability-selected-label">{language === "es" ? "Seleccionada:" : "Selected:"}</span>
          <div className="dex-ability-selected-chip">
            <span>{safeAbilities.find(a => a.slug === selectedAbility)?.name ?? selectedAbility}</span>
            <button type="button" className="dex-ability-selected-remove" onClick={() => onSelectAbility(null)}>×</button>
          </div>
        </div>
      )}

      <div className="dex-ability-list">
        {safeAbilities.map((ability) => (
          <div 
            key={ability.slug} 
            className={`dex-ability ability-${ability.rating} ${selectedAbility === ability.slug ? "selected" : ""}`}
            onClick={() => onSelectAbility(ability.slug)}
          >
            <div className="dex-ability-header">
              <span className="dex-ability-name">{ability.name}</span>
              <span className="dex-ability-badge">{ratingLabel[ability.rating][language]}</span>
            </div>
            <p className="dex-ability-desc">
              {ability.isHidden ? `(${language === "es" ? "Oculta" : "Hidden"}) ` : ""}
              {t(ability.description, language)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
