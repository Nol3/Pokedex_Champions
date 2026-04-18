import { useState, useMemo } from "react";
import { AppLanguage, CompetitivePokemon, CompetitiveMove } from "../types";
import { t } from "../utils/i18n";
import { typeColors } from "../data/pokemonData";

interface MovesPanelProps {
  moves: CompetitivePokemon["moves"];
  language: AppLanguage;
  selectedMoves: string[];
  onSelectMoves: (moves: string[]) => void;
  allMoves: CompetitiveMove[];
}

const categoryLabel = {
  stab: { es: "STAB", en: "STAB" },
  coverage: { es: "Cobertura", en: "Coverage" },
  status: { es: "Estado", en: "Status" }
} as const;

export function MovesPanel({ moves, language, selectedMoves, onSelectMoves, allMoves }: MovesPanelProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const safeMoves = moves ?? [];
  const mainSet = safeMoves.slice(0, 4);

  const currentSelectedMoves = selectedMoves.length > 0 ? selectedMoves : mainSet.map(m => m.slug);
  
  // Usar allMoves si está disponible, si no usar safeMoves
  const moveOptions = allMoves.length > 0 
    ? allMoves.map(m => ({ slug: m.slug, name: m.name, type: m.type, damageClassTag: m.damageClassTag }))
    : safeMoves.map(m => ({ slug: m.slug, name: m.name, type: m.type, damageClassTag: m.damageClassTag }));

  const filteredMoves = useMemo(() => {
    if (!searchQuery.trim()) return moveOptions.slice(0, 10);
    const normalized = searchQuery.toLowerCase();
    return moveOptions.filter(m => m.name.toLowerCase().includes(normalized) || m.slug.includes(normalized)).slice(0, 10);
  }, [searchQuery, moveOptions]);

  const handleMoveSelect = (moveSlug: string) => {
    const newMoves = [...currentSelectedMoves];
    if (editingIndex !== null) {
      newMoves[editingIndex] = moveSlug;
      onSelectMoves(newMoves);
    }
    setEditingIndex(null);
    setSearchQuery("");
  };

  const getMoveBySlug = (slug: string): CompetitiveMove | undefined => {
    // Buscar primero en safeMoves, luego en allMoves
    return safeMoves.find(m => m.slug === slug) || allMoves.find(m => m.slug === slug);
  };

  const getMoveClass = (move: CompetitiveMove): string => {
    if (move.damageClassTag === "physical") return "move-physical";
    if (move.damageClassTag === "special") return "move-special";
    return "move-status";
  };

  if (safeMoves.length === 0) {
    return (
      <div className="dex-section">
        <p className="dex-section-title">{language === "es" ? "Movimientos competitivos" : "Competitive moves"}</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          {language === "es" ? "No hay movimientos disponibles." : "No moves available."}
        </p>
      </div>
    );
  }

  return (
    <div className="dex-section">
      <p className="dex-section-title">{language === "es" ? "Movimientos" : "Moves"}</p>
      
      <div className="dex-moves-sets">
        <div className="dex-move-set">
          <p className="dex-move-set-label">{language === "es" ? "Set de movimientos" : "Move set"}</p>
          
          <div className="dex-moves-grid">
            {currentSelectedMoves.map((moveSlug, index) => {
              const move = getMoveBySlug(moveSlug);
              if (!move) return null;
              
              return (
                <div key={`${moveSlug}-${index}`} className={`dex-move-card ${getMoveClass(move)}`}>
                  {editingIndex === index ? (
                    <div className="dex-move-edit">
                      <input
                        type="text"
                        className="dex-move-search"
                        placeholder={language === "es" ? "Buscar movimiento..." : "Search move..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      {searchQuery && filteredMoves.length > 0 && (
                        <div className="dex-move-search-results">
                          {filteredMoves.map((m) => (
                            <div key={m.slug} className="dex-move-search-result" onClick={() => handleMoveSelect(m.slug)}>
                              <span className={`type-dot ${typeColors[m.type] ?? ""}`}></span>
                              <span>{m.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button className="dex-move-edit-close" onClick={() => { setEditingIndex(null); setSearchQuery(""); }}>×</button>
                    </div>
                  ) : (
                    <div className="dex-move-card-content" onClick={() => setEditingIndex(index)}>
                      <div className="dex-move-topline">
                        <span className="dex-move-name">{move.name}</span>
                        <span className={`move-tag move-${move.category}`}>{categoryLabel[move.category][language]}</span>
                      </div>
                      <span className="dex-move-meta">
                        {t(move.damageClass, language)} · {language === "es" ? "Pot" : "Pow"} {move.power ?? "—"} · {language === "es" ? "Prec" : "Acc"} {move.accuracy ?? "—"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
