import { AppLanguage, CompetitivePokemon } from "../types";

interface TeamSidebarProps {
  team: CompetitivePokemon[];
  currentSlug?: string;
  onNavigate: (slug: string) => void;
  onRemove: (slug: string) => void;
  onViewTeam: () => void;
  language: AppLanguage;
}

export function TeamSidebar({ team, currentSlug, onNavigate, onRemove, onViewTeam, language }: TeamSidebarProps) {
  const slots = Array.from({ length: 6 }, (_, i) => team[i] ?? null);
  const isFull = team.length === 6;

  return (
    <aside className="team-compact card">
      <div className="team-compact-header">
        <p className="eyebrow">{language === "es" ? "Mi Equipo" : "My Team"}</p>
        <span className="team-count">{team.length}/6</span>
      </div>

      <div className="team-compact-slots">
        {slots.map((pokemon, i) =>
          pokemon ? (
            <button
              key={pokemon.slug}
              type="button"
              className={`team-compact-slot team-compact-slot-filled ${currentSlug === pokemon.slug ? "team-compact-slot-active" : ""}`}
              onClick={() => onNavigate(pokemon.slug)}
              title={pokemon.name}
            >
              <img src={pokemon.artwork} alt={pokemon.name} className="team-compact-art" />
              <button
                type="button"
                className="team-compact-remove"
                onClick={(e) => { e.stopPropagation(); onRemove(pokemon.slug); }}
                title={language === "es" ? "Quitar" : "Remove"}
              >
                ×
              </button>
            </button>
          ) : (
            <div key={`empty-${i}`} className="team-compact-slot team-compact-slot-empty" />
          )
        )}
      </div>

      {isFull && (
        <button type="button" className="view-team-button" onClick={onViewTeam}>
          {language === "es" ? "Ver resumen →" : "View summary →"}
        </button>
      )}
    </aside>
  );
}
