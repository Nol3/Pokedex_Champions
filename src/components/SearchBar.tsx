import { AppLanguage, PokemonOption } from "../types";

interface SearchBarProps {
  value: string;
  suggestions: PokemonOption[];
  onChange: (value: string) => void;
  onSubmit: (value?: string) => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
  isLoading: boolean;
}

export function SearchBar({
  value,
  suggestions,
  onChange,
  onSubmit,
  language,
  onToggleLanguage,
  isLoading
}: SearchBarProps) {
  return (
    <section className="search-panel">
      <div className="search-panel-top">
        <p className="eyebrow">Pokedex Competitiva</p>
        <button type="button" className="language-button" onClick={onToggleLanguage}>
          {language === "es" ? "English" : "Español"}
        </button>
      </div>

      <div>
        <h1>
          {language === "es"
            ? "Pokemon Champions"
            : "Pokemon Champions"}
        </h1>
      </div>

      <div className="search-stack">
        <div className="search-row">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
            className="search-input"
            placeholder={
              language === "es"
                ? "Busca: Garchomp, Rotom Wash, Charizard Mega X..."
                : "Search: Garchomp, Rotom Wash, Charizard Mega X..."
            }
          />
          <button type="button" onClick={() => onSubmit()} className="search-button" disabled={isLoading}>
            {isLoading ? (language === "es" ? "Buscando..." : "Searching...") : language === "es" ? "Analizar" : "Analyze"}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions-panel">
            {suggestions.map((option) => (
              <button
                key={option.slug}
                type="button"
                className="suggestion-item"
                onClick={() => onSubmit(option.slug)}
              >
                {option.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
