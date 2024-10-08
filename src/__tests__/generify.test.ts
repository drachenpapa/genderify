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
import { analyzeSelectedText, findings, removeFromFindings, replaceWordInDocument, scanText, setFindings, setupHtmlElements } from "../taskpane/genderify";

beforeAll(() => {
  global.alert = jest.fn();
});


describe("Genderify Functions", () => {
  beforeEach(() => {
    setFindings([]);

    document.body.innerHTML = `
      <input id="${InputIds.GenderChar}" value="a" />
      <input id="${InputIds.FoundWord}" />
      <input id="${InputIds.GenderedWord}" />
      <select id="${SelectionIds.GenderNeutralWord}"></select>
      <button id="${ButtonIds.ApplyGenderNeutral}"></button>
      <button id="${ButtonIds.ApplyGendered}"></button>
      <button id="${ButtonIds.PrevButton}"></button>
      <button id="${ButtonIds.NextButton}"></button>
      <div id="selection" style="display: none;"></div>
    `;
    setupHtmlElements();
  });

  test("scanText correctly identifies gendered words", () => {
    scanText("This is a test sentence with he and she.");
    expect(findings().length).toBe(2);
    expect(findings()[0].word).toBe("he");
    expect(findings()[1].word).toBe("she");
  });

  test("replaceWordInDocument replaces the current word", async () => {
    scanText("This is a test sentence with he.");

    jest.spyOn(mockOffice.context.document, 'getSelectedDataAsync').mockImplementation((coercionType, callback) => {
      callback({
        status: Office.AsyncResultStatus.Succeeded,
        value: "This is a test sentence with he."
      });
    });
    const mockRewriteDocument = jest.spyOn(mockOffice.context.document, 'setSelectedDataAsync');

    (document.getElementById(InputIds.GenderedWord) as HTMLInputElement).value = "they";

    await replaceWordInDocument(InputIds.GenderedWord);
    expect(mockRewriteDocument).toHaveBeenCalledWith("This is a test sentence with they.", expect.any(Function));
  });

  test("removeFromFindings updates the findings list", () => {
    setFindings([{ word: "he", genderNeutralWords: ["they"], genderBaseForm: "he" }]);
    removeFromFindings();
    expect(findings().length).toBe(0);
  });

  test("analyzeSelectedText retrieves selected data", () => {
    analyzeSelectedText();
    expect(mockOffice.context.document.getSelectedDataAsync).toHaveBeenCalled();
  });
});
