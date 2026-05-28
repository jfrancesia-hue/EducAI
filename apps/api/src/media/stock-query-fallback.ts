const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "on",
  "at",
  "of",
  "for",
  "with",
  "and",
  "or",
  "to",
  "from",
  "by",
  "as",
  "into",
  "about",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "y",
  "o",
  "en",
  "con",
  "para",
  "por",
  "sobre",
]);

/**
 * Claude a veces genera queries ultra-específicas que devuelven 0 resultados
 * en stock ("argentine teacher whiteboard math inclusive scaffold"). Caer a
 * las 2 palabras más significativas suele traer algo razonable.
 *
 * El caller debe comparar el resultado contra el query original para decidir
 * si vale la pena re-buscar (si son iguales, no hay diferencia).
 */
export function queryFallback(query: string): string {
  const words = query
    .toLowerCase()
    .normalize("NFD")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  return words.slice(0, 2).join(" ");
}
