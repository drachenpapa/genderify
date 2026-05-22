import type { FindingType } from "./types";

export function collectFindings(text: string, dictionary: Record<string, FindingType>): FindingType[] {
  const words = normalizeWords(text);
  const foundWords = new Set<string>();
  const results: FindingType[] = [];

  words.forEach((word) => {
    const finding = dictionary[word];
    if (finding && !foundWords.has(finding.word)) {
      results.push(finding);
      foundWords.add(finding.word);
    }
  });

  return results;
}

export function buildGenderedVariant(baseForm: string | undefined, genderChar: string): string {
  return baseForm ? `${baseForm}${genderChar}innen` : "";
}

export function replaceWholeWord(text: string, wordToReplace: string, replacementWord: string): string {
  const escapedWordToReplace = escapeRegExp(wordToReplace);
  return text.replace(new RegExp(String.raw`\b${escapedWordToReplace}\b`, "gi"), replacementWord);
}

function normalizeWords(text: string): string[] {
  return text.replace(/[.,;:!?()]+/g, "").toLowerCase().split(/\s+/).filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
