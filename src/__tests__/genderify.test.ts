jest.mock("../taskpane/genderDictionary.json", () => ({
  he: {
    word: "he",
    genderNeutralWords: ["they"],
    genderBaseForm: "he"
  },
  she: {
    word: "she",
    genderNeutralWords: ["they"],
    genderBaseForm: "she"
  }
}));

import mockOffice from "./mocks";
(global as any).Office = mockOffice;

import { ButtonIds, InputIds, SelectionIds, DisplayIds } from "../taskpane/enums";
import { GenderifyApp, isAsyncSucceeded } from "../taskpane/genderify";

let app: GenderifyApp;

describe("Genderify Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // reset call counts between tests
    app = new GenderifyApp();

    document.body.innerHTML = `
      <input id="${InputIds.GenderChar}" value="a" />
      <input id="${InputIds.FoundWord}" />
      <input id="${InputIds.GenderedWord}" />
      <select id="${SelectionIds.GenderNeutralWord}"></select>
      <button id="${ButtonIds.AnalyzeButton}"></button>
      <button id="${ButtonIds.ApplyGenderNeutral}"></button>
      <button id="${ButtonIds.ApplyGendered}"></button>
      <button id="${ButtonIds.PrevButton}"></button>
      <button id="${ButtonIds.NextButton}"></button>
      <span id="${DisplayIds.Progress}"></span>
      <p id="${DisplayIds.StatusMessage}"></p>
    `;
    app.setupHtmlElements();
  });

  // ── Scan & UI state ──────────────────────────────────────────────────────

  test("scanText correctly identifies gendered words", () => {
    app.scanText("This is a test sentence with he and she.");
    expect(app.findings.length).toBe(2);
    expect(app.findings[0].word).toBe("he");
    expect(app.findings[1].word).toBe("she");
  });

  test("scanText shows status message when no words match", () => {
    app.scanText("No gendered words in this text.");
    const statusEl = document.getElementById(DisplayIds.StatusMessage);
    expect(statusEl?.textContent).toBe("Keine passenden Wörter gefunden.");
  });

  test("scanText updates progress indicator", () => {
    app.scanText("he and she");
    const progressEl = document.getElementById(DisplayIds.Progress);
    expect(progressEl?.textContent).toBe("1 / 2");
  });

  test("scanText disables prev and enables next button with multiple findings", () => {
    app.scanText("he and she");
    expect((document.getElementById(ButtonIds.PrevButton) as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById(ButtonIds.NextButton) as HTMLButtonElement).disabled).toBe(false);
  });

  // ── Navigation ───────────────────────────────────────────────────────────

  test("goToNextMatch advances to next finding and updates foundWord", () => {
    app.scanText("he and she");
    app.goToNextMatch();
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("she");
    expect(document.getElementById(DisplayIds.Progress)?.textContent).toBe("2 / 2");
  });

  test("goToPreviousMatch returns to previous finding", () => {
    app.scanText("he and she");
    app.goToNextMatch();
    app.goToPreviousMatch();
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("he");
    expect(document.getElementById(DisplayIds.Progress)?.textContent).toBe("1 / 2");
  });

  test("goToPreviousMatch does nothing when already at first finding", () => {
    app.scanText("he");
    app.goToPreviousMatch();
    expect(app.findings.length).toBe(1);
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("he");
  });

  test("goToNextMatch does nothing when already at last finding", () => {
    app.scanText("he");
    app.goToNextMatch();
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("he");
    expect(document.getElementById(DisplayIds.Progress)?.textContent).toBe("1 / 1");
  });

  // ── Findings management ──────────────────────────────────────────────────

  test("removeFromFindings removes the only finding and resets the UI", () => {
    app.scanText("he");
    expect(app.findings.length).toBe(1);
    app.removeFromFindings();
    expect(app.findings.length).toBe(0);
    expect(document.getElementById(DisplayIds.Progress)?.textContent).toBe("");
  });

  test("removeFromFindings adjusts currentIndex when removing last finding in list", () => {
    app.scanText("he and she");
    app.goToNextMatch();
    app.removeFromFindings();
    expect(app.findings.length).toBe(1);
    expect(app.findings[0].word).toBe("he");
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("he");
  });

  // ── replaceWordInDocument ────────────────────────────────────────────────

  test("replaceWordInDocument replaces the current word", async () => {
    app.scanText("This is a test sentence with he.");

    jest.spyOn(mockOffice.context.document, "getSelectedDataAsync").mockImplementation((coercionType, callback) => {
      callback({
        status: Office.AsyncResultStatus.Succeeded,
        value: "This is a test sentence with he."
      });
    });
    const mockSetSelectedData = jest.spyOn(mockOffice.context.document, "setSelectedDataAsync");

    (document.getElementById(InputIds.GenderedWord) as HTMLInputElement).value = "they";

    await app.replaceWordInDocument(InputIds.GenderedWord);
    expect(mockSetSelectedData).toHaveBeenCalledWith("This is a test sentence with they.", expect.any(Function));
  });

  test("replaceWordInDocument does nothing when the input value is empty", async () => {
    app.scanText("he");
    expect(app.findings.length).toBe(1);

    (document.getElementById(InputIds.GenderedWord) as HTMLInputElement).value = "";

    await app.replaceWordInDocument(InputIds.GenderedWord);

    expect(app.findings.length).toBe(1);
    expect(app.findings[0].word).toBe("he");
  });

  // ── analyzeSelectedText ──────────────────────────────────────────────────

  test("analyzeSelectedText retrieves selected data", () => {
    app.analyzeSelectedText();
    expect(mockOffice.context.document.getSelectedDataAsync).toHaveBeenCalled();
  });

  // ── isAsyncSucceeded ─────────────────────────────────────────────────────

  test("isAsyncSucceeded returns true for Succeeded status", () => {
    expect(isAsyncSucceeded({ status: Office.AsyncResultStatus.Succeeded } as Office.AsyncResult<any>)).toBe(true);
  });

  test("isAsyncSucceeded returns false for any other status", () => {
    expect(isAsyncSucceeded({ status: "failed" } as any)).toBe(false);
  });
});
