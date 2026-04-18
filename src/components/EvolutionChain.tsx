import { AppLanguage, CompetitivePokemon } from "../types";

interface EvolutionChainProps {
  evolutionLines: CompetitivePokemon["evolutionLines"];
  megaForms: CompetitivePokemon["megaForms"];
  onNavigate: (slug: string) => void;
  language: AppLanguage;
}

export function EvolutionChain({ evolutionLines, megaForms, onNavigate, language }: EvolutionChainProps) {
  return (
    <div className="dex-section">
      <p className="dex-section-title">{language === "es" ? "Línea evolutiva" : "Evolution line"}</p>
      <div className="dex-evolution-list">
        {evolutionLines.map((line, lineIndex) => (
          <div key={`${line[0]?.slug ?? "line"}-${lineIndex}`} className="dex-evolution-line">
            {line.map((step, stepIndex) => (
              <span key={`${step.slug}-${stepIndex}`} className="dex-evo-entry">
                {stepIndex > 0 && <span className="dex-evo-arrow">→</span>}
                <button type="button" className="dex-evo-step" onClick={() => onNavigate(step.slug)}>
                  <span>{step.name}</span>
                  {step.triggerLabel && <small>{step.triggerLabel}</small>}
                </button>
              </span>
            ))}
          </div>
        ))}
      </div>
      {megaForms.length > 0 && (
        <div className="dex-mega-chips">
          {megaForms.map((form, index) => (
            <button key={`${form.slug}-${index}`} type="button" className="dex-mega-chip" onClick={() => onNavigate(form.slug)}>
              {form.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
