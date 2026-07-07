import { sanitizeRegex, scanText, replaceInText, type Finding } from "../core/textAnalyzer";

// ── Test dictionary ──────────────────────────────────────────────────────────

const dict: Record<string, Finding> = {
  mann: {
    word: "Mann",
    genderNeutralWords: ["Person", "Mensch"],
    genderBaseForm: "Mitarbeiter",
  },
  mitarbeiter: {
    word: "Mitarbeiter",
    genderNeutralWords: ["Mitarbeitende"],
    genderBaseForm: "Mitarbeiter",
  },
  arzt: {
    word: "Arzt",
    genderNeutralWords: ["Ärztin oder Arzt", "Medizinperson"],
    genderBaseForm: "",
  },
};

// ── sanitizeRegex ────────────────────────────────────────────────────────────

describe("sanitizeRegex", () => {
  test("passes a plain string through unchanged", () => {
    expect(sanitizeRegex("hallo")).toBe("hallo");
  });

  test("escapes a dot", () => {
    expect(sanitizeRegex("a.b")).toBe(String.raw`a\.b`);
  });

  test("escapes multiple special characters", () => {
    expect(sanitizeRegex("a.b+c*d?")).toBe(String.raw`a\.b\+c\*d\?`);
  });

  test("escapes parentheses and brackets", () => {
    expect(sanitizeRegex("(test)[x]")).toBe(String.raw`\(test\)\[x\]`);
  });

  test("escapes a backslash itself", () => {
    expect(sanitizeRegex("a\\b")).toBe(String.raw`a\\b`);
  });

  test("escapes caret, dollar and pipe", () => {
    expect(sanitizeRegex("^foo$|bar")).toBe(String.raw`\^foo\$\|bar`);
  });
});

// ── scanText ─────────────────────────────────────────────────────────────────

describe("scanText", () => {
  test("returns an empty array for empty text", () => {
    expect(scanText("", dict)).toHaveLength(0);
  });

  test("returns an empty array when no words match", () => {
    expect(scanText("Hallo schöne Welt", dict)).toHaveLength(0);
  });

  test("finds a single matching word", () => {
    const result = scanText("Der Mann ist hier.", dict);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("Mann");
  });

  test("is case-insensitive", () => {
    expect(scanText("MANN", dict)).toHaveLength(1);
    expect(scanText("mann", dict)).toHaveLength(1);
    expect(scanText("Mann", dict)).toHaveLength(1);
  });

  test("deduplicates the same word appearing multiple times", () => {
    const result = scanText("Mann, Mann und nochmal Mann", dict);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("Mann");
  });

  test("finds multiple distinct matching words", () => {
    const result = scanText("Der Mitarbeiter und der Mann", dict);
    expect(result).toHaveLength(2);
  });

  test("preserves the order of first occurrence", () => {
    const result = scanText("Der Mitarbeiter kommt, dann der Mann", dict);
    expect(result[0].word).toBe("Mitarbeiter");
    expect(result[1].word).toBe("Mann");
  });

  test("strips punctuation before matching", () => {
    const result = scanText("Guten Tag, Mann! Wie geht's?", dict);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("Mann");
  });

  test("strips parentheses before matching", () => {
    const result = scanText("(Mann)", dict);
    expect(result).toHaveLength(1);
  });

  test("returns the full Finding object with all fields", () => {
    const [finding] = scanText("Mann", dict);
    expect(finding.genderNeutralWords).toEqual(["Person", "Mensch"]);
    expect(finding.genderBaseForm).toBe("Mitarbeiter");
  });
});

// ── replaceInText ────────────────────────────────────────────────────────────

describe("replaceInText", () => {
  test("replaces a single occurrence", () => {
    expect(replaceInText("Der Mann ist hier.", "Mann", "Person")).toBe("Der Person ist hier.");
  });

  test("replaces multiple occurrences", () => {
    expect(replaceInText("Mann und Mann", "Mann", "Person")).toBe("Person und Person");
  });

  test("is case-insensitive", () => {
    expect(replaceInText("MANN und mann", "Mann", "Person")).toBe("Person und Person");
  });

  test("respects word boundaries – does not replace inside longer words", () => {
    expect(replaceInText("Mannschaft und Mann", "Mann", "Person")).toBe("Mannschaft und Person");
  });

  test("returns the original text unchanged when the word is not found", () => {
    expect(replaceInText("Hallo Welt", "Mann", "Person")).toBe("Hallo Welt");
  });

  test("handles a word that contains regex special characters", () => {
    expect(replaceInText("a.b and axb", "a.b", "x")).toBe("x and axb");
  });

  test("does not throw when the word contains regex special characters", () => {
    expect(() => replaceInText("some (parentheses) here", "(parentheses)", "x")).not.toThrow();
    expect(() => replaceInText("value a+b in text", "a+b", "x")).not.toThrow();
  });

  test("replaces a word at the start of the string", () => {
    expect(replaceInText("Mann ist da", "Mann", "Person")).toBe("Person ist da");
  });

  test("replaces a word at the end of the string", () => {
    expect(replaceInText("Das ist der Mann", "Mann", "Person")).toBe("Das ist der Person");
  });
});
