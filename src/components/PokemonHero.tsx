import { AppLanguage, CompetitivePokemon } from "../types";
import { typeColors, typeIcons, typeLabels } from "../data/pokemonData";
import { t } from "../utils/i18n";

interface PokemonHeroProps {
  pokemon: CompetitivePokemon;
  onSelect: () => void;
  onNavigate: (slug: string) => void;
  isSelected: boolean;
  language: AppLanguage;
  selectedItem: string | null;
}

const SPRITE_ITEM = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

export function PokemonHero({ pokemon, onSelect, onNavigate, isSelected, language, selectedItem }: PokemonHeroProps) {
  const isMega = pokemon.slug.includes("-mega");
  const otherForms = (pokemon.megaForms ?? []).filter((f) => f.slug !== pokemon.slug);

  return (
    <div className="dex-hero">
      <div className="dex-art-col">
        <div className="dex-artwork-wrap">
          <img src={pokemon.artwork} alt={pokemon.name} className="dex-artwork" />
          {selectedItem && (
            <img src={`${SPRITE_ITEM}/${selectedItem}.png`} alt="" className="dex-artwork-item" />
          )}
        </div>
        {(isMega || otherForms.length > 0) && (
          <div className="dex-forms">
            {isMega && pokemon.baseFormSlug && (
              <button type="button" className="dex-form-btn dex-form-btn-base" onClick={() => onNavigate(pokemon.baseFormSlug!)}>
                ← {language === "es" ? "Base" : "Base"}
              </button>
            )}
            {otherForms.map((form) => (
              <button key={form.slug} type="button" className="dex-form-btn" onClick={() => onNavigate(form.slug)}>
                {form.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="dex-info-col">
        <div className="dex-info-topline">
          <div>
            <h2 className="dex-pokemon-name">{pokemon.name}</h2>
            <div className="type-list" style={{ marginTop: "6px" }}>
              {pokemon.types.map((type) => (
                <span key={type} className={`type-pill type-pill-icon ${typeColors[type] ?? ""}`}>
                  {typeIcons[type] && <img src={typeIcons[type]} alt="" className="type-icon" loading="lazy" />}
                  {typeLabels[type]?.[language] ?? type}
                </span>
              ))}
            </div>
          </div>
          <div className="dex-hero-actions">
            <button type="button" className={`team-button ${isSelected ? "team-button-active" : ""}`} onClick={onSelect}>
              {isSelected
                ? language === "es" ? "En equipo" : "On team"
                : language === "es" ? "Añadir al equipo" : "Add to team"}
            </button>
            <span className="dex-role-badge">{t(pokemon.role, language)}</span>
          </div>
        </div>
        <p className="dex-summary">{t(pokemon.summary, language)}</p>
      </div>
    </div>
  );
}
