import { AppLanguage, LocalizedText } from "../types";

export function t(text: LocalizedText | string | undefined, language: AppLanguage): string {
  if (!text) {
    return "";
  }

  if (typeof text === "string") {
    return text;
  }

  return text[language] ?? text.es ?? text.en ?? "";
}
