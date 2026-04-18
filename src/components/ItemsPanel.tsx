import { useState, useMemo } from "react";
import { AppLanguage, CompetitivePokemon } from "../types";
import { allCompetitiveItems } from "../data/pokemonData";
import { t } from "../utils/i18n";

interface ItemsPanelProps {
  items: CompetitivePokemon["items"];
  language: AppLanguage;
  selectedItem: string | null;
  onSelectItem: (slug: string | null) => void;
}

const SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

export function ItemsPanel({ items, language, selectedItem, onSelectItem }: ItemsPanelProps) {
  const [search, setSearch] = useState("");
  const recommendedItems = items ?? [];
  const recommendedSlugs = new Set(recommendedItems.map((i) => i.slug));

  const filteredItems = useMemo(() => {
    if (!search.trim()) return [];
    const normalized = search.toLowerCase();
    return allCompetitiveItems.filter((item) =>
      item.name.toLowerCase().includes(normalized)
    ).slice(0, 10);
  }, [search]);

  return (
    <div className="dex-section">
      <p className="dex-section-title">{language === "es" ? "Objeto equipable" : "Held item"}</p>

      <div className="dex-item-search-wrap">
        <input
          type="text"
          className="dex-item-search"
          placeholder={language === "es" ? "Buscar objeto..." : "Search item..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="dex-item-search-clear"
            onClick={() => setSearch("")}
          >
            ×
          </button>
        )}
      </div>

      {search && filteredItems.length > 0 && (
        <div className="dex-item-search-results">
          {filteredItems.map((item) => (
            <div
              key={item.slug}
              className={`dex-item-search-result ${selectedItem === item.slug ? "selected" : ""}`}
              onClick={() => { onSelectItem(item.slug); setSearch(""); }}
            >
              <img src={`${SPRITE}/${item.slug}.png`} alt="" className="dex-item-search-icon" />
              <span>{item.name}</span>
              {recommendedSlugs.has(item.slug) && <span className="dex-item-recommended-tag">✓</span>}
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="dex-item-selected">
          <span className="dex-item-selected-label">{language === "es" ? "Seleccionado:" : "Selected:"}</span>
          <div className="dex-item-selected-chip">
            <img src={`${SPRITE}/${selectedItem}.png`} alt="" className="dex-item-chip-icon" />
            <span>{allCompetitiveItems.find((i) => i.slug === selectedItem)?.name ?? selectedItem}</span>
            <button type="button" className="dex-item-selected-remove" onClick={() => onSelectItem(null)}>×</button>
          </div>
        </div>
      )}

      {recommendedItems.length > 0 && (
        <>
          <p className="dex-items-sublabel">{language === "es" ? "Recomendados:" : "Recommended:"}</p>
          <div className="dex-items-recommended">
            {recommendedItems.slice(0, 2).map((item) => (
              <div
                key={item.name}
                className={`dex-item-rec ${selectedItem === item.slug ? "selected" : ""}`}
                onClick={() => onSelectItem(item.slug)}
              >
                <img src={item.imageUrl} alt="" className="dex-item-rec-icon" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
