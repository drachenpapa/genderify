import mockOffice from "./mocks";
// stateStore nutzt den Office.HostType-Typ; der Mock liefert konsistente Testwerte.
(global as any).Office = mockOffice;

import {
  findings,
  getCurrentFinding,
  moveToNextFinding,
  moveToPreviousFinding,
  removeCurrentFinding,
  setFindings,
  setHostType,
  state,
} from "../taskpane/stateStore";

describe("stateStore", () => {
  beforeEach(() => {
    setFindings([]);
    setHostType(null);
  });

  test("setFindings resets index and exposes findings", () => {
    state.currentIndex = 1;

    setFindings([
      { word: "he", genderNeutralWords: ["they"], genderBaseForm: "he" },
      { word: "she", genderNeutralWords: ["they"], genderBaseForm: "she" },
    ]);

    expect(state.currentIndex).toBe(0);
    expect(findings()).toHaveLength(2);
    expect(getCurrentFinding()?.word).toBe("he");
  });

  test("navigation respects bounds", () => {
    setFindings([
      { word: "he", genderNeutralWords: ["they"], genderBaseForm: "he" },
      { word: "she", genderNeutralWords: ["they"], genderBaseForm: "she" },
    ]);

    expect(moveToPreviousFinding()).toBe(false);
    expect(state.currentIndex).toBe(0);

    expect(moveToNextFinding()).toBe(true);
    expect(state.currentIndex).toBe(1);

    expect(moveToNextFinding()).toBe(false);
    expect(state.currentIndex).toBe(1);
  });

  test("removeCurrentFinding updates index and empty-state flag", () => {
    setFindings([
      { word: "he", genderNeutralWords: ["they"], genderBaseForm: "he" },
      { word: "she", genderNeutralWords: ["they"], genderBaseForm: "she" },
    ]);

    moveToNextFinding();

    expect(removeCurrentFinding()).toBe(false);
    expect(findings()).toHaveLength(1);
    expect(state.currentIndex).toBe(0);
    expect(getCurrentFinding()?.word).toBe("he");

    expect(removeCurrentFinding()).toBe(true);
    expect(findings()).toHaveLength(0);
    expect(state.currentIndex).toBe(0);
  });

  test("setHostType stores current host", () => {
    setHostType(mockOffice.HostType.Word as unknown as Office.HostType);
    expect(state.hostType).toBe(mockOffice.HostType.Word);
  });
});
