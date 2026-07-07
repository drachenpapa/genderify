/**
 * Shared text analysis and replacement utilities used by both
 * the Office Add-in taskpane and the standalone web frontend.
 */

export interface Finding {
  word: string;
  genderNeutralWords: string[];
  genderBaseForm?: string;
}

/**
 * Escapes all special regex characters in a string so it can safely
 * be used inside a RegExp constructor.
 *
 * @param str - The string to escape.
 * @returns The escaped string.
 */
export function sanitizeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * Scans the given text for words present in the dictionary and returns
 * the unique findings. Duplicate entries (the same canonical word form) are
 * excluded via a Set guard.
 *
 * @param text - The text to scan.
 * @param dictionary - The gender dictionary to look up words in.
 * @returns An ordered array of findings without duplicates.
 */
export function scanText(text: string, dictionary: Record<string, Finding>): Finding[] {
  const words = text.replace(/[.,;:!?()]*/g, "").toLowerCase().split(/\s+/);
  const seenWords = new Set<string>();
  const findings: Finding[] = [];

  for (const word of words) {
    const entry = dictionary[word];
    if (entry && !seenWords.has(entry.word)) {
      findings.push(entry);
      seenWords.add(entry.word);
    }
  }

  return findings;
}

/**
 * Replaces all occurrences of a word (whole-word, case-insensitive) in the
 * given text. The word is regex-escaped before matching so that dictionary
 * entries containing special characters cannot cause regex errors.
 *
 * @param text - The source text.
 * @param wordToReplace - The word to find and replace.
 * @param replacement - The replacement string.
 * @returns The text with all matching occurrences replaced.
 */
export function replaceInText(text: string, wordToReplace: string, replacement: string): string {
  return text.replace(
    new RegExp(String.raw`\b${sanitizeRegex(wordToReplace)}\b`, "gi"),
    replacement
  );
}
