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

import { ButtonIds, InputIds, SelectionIds } from "../taskpane/enums";
import {
  analyzeSelectedText,
  findings,
  goToNextMatch,
  goToPreviousMatch,
  removeFromFindings,
  replaceWordInDocument,
  scanText,
  state,
  updateSelectionMenu,
} from "../taskpane/genderify";

const getStatusElement = (): HTMLDivElement => document.getElementById("status-message") as HTMLDivElement;

describe("Genderify Functions", () => {
  beforeEach(() => {
    state.findings = [];
    state.currentIndex = 0;

    document.body.innerHTML = `
      <input id="${InputIds.GenderChar}" value="a" />
      <input id="${InputIds.FoundWord}" />
      <input id="${InputIds.GenderedWord}" />
      <select id="${SelectionIds.GenderNeutralWord}"></select>
      <button id="${ButtonIds.ApplyGenderNeutral}"></button>
      <button id="${ButtonIds.ApplyGendered}"></button>
      <button id="${ButtonIds.PrevButton}"></button>
      <button id="${ButtonIds.NextButton}"></button>
      <div id="status-message" class="status-message"></div>
      <div id="selection" style="display: none;"></div>
    `;
  });

  test("scanText correctly identifies gendered words", () => {
    scanText("This is a test sentence with he and she.");

    expect(findings().length).toBe(2);
    expect(findings()[0].word).toBe("he");
    expect(findings()[1].word).toBe("she");
  });

  test("scanText handles empty input and sets info status", () => {
    scanText("");

    expect(findings().length).toBe(0);
    expect(getStatusElement().textContent).toBe("Keine passenden Wörter gefunden.");
  });

  test("scanText ignores punctuation-only input", () => {
    scanText("!!! ,,, ;;;");

    expect(findings().length).toBe(0);
    expect(getStatusElement().textContent).toBe("Keine passenden Wörter gefunden.");
  });

  test("replaceWordInDocument replaces the current word", async () => {
    scanText("This is a test sentence with he.");

    jest.spyOn(mockOffice.context.document, "getSelectedDataAsync").mockImplementation((coercionType, callback) => {
      callback({
        status: Office.AsyncResultStatus.Succeeded,
        value: "This is a test sentence with he."
      });
    });
    const mockRewriteDocument = jest.spyOn(mockOffice.context.document, "setSelectedDataAsync");

    (document.getElementById(InputIds.GenderedWord) as HTMLInputElement).value = "they";

    await replaceWordInDocument(InputIds.GenderedWord);
    expect(mockRewriteDocument).toHaveBeenCalledWith("This is a test sentence with they.", expect.any(Function));
  });

  test("navigation stays within bounds", () => {
    scanText("he she");

    goToPreviousMatch();
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("he");

    goToNextMatch();
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("she");

    goToNextMatch();
    expect((document.getElementById(InputIds.FoundWord) as HTMLInputElement).value).toBe("she");
  });

  test("updateSelectionMenu leaves gendered field empty when no genderBaseForm exists", () => {
    state.findings = [{ word: "test", genderNeutralWords: ["neutral"] }];
    state.currentIndex = 0;

    updateSelectionMenu();

    expect((document.getElementById(InputIds.GenderedWord) as HTMLInputElement).value).toBe("");
  });

  test("removeFromFindings updates the findings list", () => {
    state.findings = [{ word: "he", genderNeutralWords: ["they"], genderBaseForm: "he" }];

    removeFromFindings();

    expect(findings().length).toBe(0);
    expect(getStatusElement().textContent).toBe("Alle Treffer wurden verarbeitet.");
  });

  test("analyzeSelectedText retrieves selected data", () => {
    analyzeSelectedText();
    expect(mockOffice.context.document.getSelectedDataAsync).toHaveBeenCalled();
  });
});
