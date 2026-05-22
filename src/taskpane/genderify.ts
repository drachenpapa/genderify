import { InputIds, SelectionIds } from "./enums";
import GenderDictionary from "./genderDictionary.json";
import { getSelectedText, setSelectedText } from "./officeClient";
import {
  findings,
  getCurrentFinding,
  moveToNextFinding,
  moveToPreviousFinding,
  removeCurrentFinding,
  setFindings,
  setHostType,
  state,
} from "./stateStore";
import { buildGenderedVariant, collectFindings, replaceWholeWord } from "./textProcessing";
import type { FindingType } from "./types";
import {
  bindTaskpaneEventListeners,
  clearInputs,
  clearStatus,
  createDomRefs,
  type DomRefs,
  hasRequiredDomElements,
  renderFinding,
  showStatus,
  toggleButtons,
} from "./ui";

export { findings, state };

const genderDictionary: Record<string, FindingType> = GenderDictionary;

let domRefs: DomRefs;

function ensureDomRefs(): boolean {
  if (domRefs && areDomRefsConnected(domRefs)) {
    return true;
  }

  if (!hasRequiredDomElements()) {
    return false;
  }

  domRefs = createDomRefs();
  return true;
}

function areDomRefsConnected(nextDomRefs: DomRefs): boolean {
  return [
    nextDomRefs.applyGenderNeutralButton,
    nextDomRefs.applyGenderedButton,
    nextDomRefs.prevButton,
    nextDomRefs.nextButton,
    nextDomRefs.genderCharInput,
    nextDomRefs.foundWordInput,
    nextDomRefs.genderedWordInput,
    nextDomRefs.genderNeutralWordSelect,
    nextDomRefs.statusMessage,
  ].every((element) => element.isConnected);
}

/**
 * Main function that runs when the Office app is ready.
 * It initializes the setup for HTML elements and event listeners.
 */
export async function setup() {
  domRefs = createDomRefs();
  bindTaskpaneEventListeners(domRefs, {
    analyzeSelectedText,
    applyGenderNeutral: () => replaceWordInDocument(SelectionIds.GenderNeutralWord),
    applyGendered: () => replaceWordInDocument(InputIds.GenderedWord),
    goToPreviousMatch,
    goToNextMatch,
  });
}

function getAsyncErrorMessage<T>(result: Office.AsyncResult<T>): string {
  const officeError = (result as Office.AsyncResult<T> & { error?: Office.Error }).error;
  return officeError?.message ?? "Unbekannter Fehler";
}

/**
 * Retrieves the selected text from the Word document and starts the analysis.
 * If the text is successfully retrieved, the scanText function is called
 * to look for gender-specific words.
 */
export async function analyzeSelectedText() {
  clearStatus(domRefs);

  try {
    const result = await getSelectedText(state.hostType);
    if (isAsyncSucceeded(result)) {
      scanText(result.value);
    } else {
      showStatus(domRefs, `Fehler beim Abrufen des ausgewählten Textes: ${getAsyncErrorMessage(result)}`, "error");
    }
  } catch (error) {
    showStatus(domRefs, `Fehler beim Abrufen des ausgewählten Textes: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, "error");
  }
}

/**
 * Scans the given text for words that are included in the gender dictionary
 * and stores the findings in the findings list.
 * The function uses a Set to avoid duplicate findings.
 *
 * @param {string} text - The text to scan.
 */
export function scanText(text: string) {
  setFindings(collectFindings(text, genderDictionary));

  const hasDom = ensureDomRefs();

  if (findings().length > 0) {
    if (!hasDom) {
      return;
    }

    clearStatus(domRefs);
    updateSelectionMenu();
  } else {
    if (hasDom) {
      showStatus(domRefs, "Keine passenden Wörter gefunden.");
      resetUI();
    }
  }
}

/**
 * Updates the selection menu with the current word and its alternatives.
 * It enables or disables buttons based on the current state of findings.
 */
export function updateSelectionMenu() {
  if (!ensureDomRefs()) {
    return;
  }

  const find = getCurrentFinding();
  if (!find) {
    resetUI();
    return;
  }

  const genderedVariant = find.genderBaseForm;
  const renderedGenderedVariant = buildGenderedVariant(genderedVariant, domRefs.genderCharInput.value);

  renderFinding(domRefs, find, renderedGenderedVariant);
  toggleButtons(domRefs, false, state.currentIndex, findings().length, Boolean(renderedGenderedVariant));
}

/**
 * Applies the selected word replacement in the document.
 *
 * @param {InputIds | SelectionIds} inputId - The ID of the input/select element containing the replacement word.
 * This function handles the replacement and updates the findings list.
 */
export async function replaceWordInDocument(inputId: InputIds | SelectionIds) {
  const replacementSource = document.getElementById(inputId) as HTMLInputElement | HTMLSelectElement | null;
  if (!replacementSource?.value) return;

  try {
    await rewriteDocument(replacementSource.value);
    removeFromFindings();
  } catch (error) {
    showStatus(domRefs, `Fehler beim Ersetzen des Wortes: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, "error");
  }
}

/**
 * Rewrites the document by replacing the current word with a new one.
 *
 * @param {string} replacementWord - The word to replace the current finding with.
 */
async function rewriteDocument(replacementWord: string) {
  const currentFinding = getCurrentFinding();
  if (!currentFinding) {
    throw new Error("Kein aktiver Treffer vorhanden.");
  }

  const wordToReplace = currentFinding.word;

  const result = await getSelectedText(state.hostType);

  if (!isAsyncSucceeded(result)) {
    throw new Error(getAsyncErrorMessage(result));
  }

  const updatedText = replaceWholeWord(result.value, wordToReplace, replacementWord);

  const setAsyncResult = await setSelectedText(state.hostType, updatedText);

  if (!isAsyncSucceeded(setAsyncResult)) {
    throw new Error(getAsyncErrorMessage(setAsyncResult));
  }
}

/**
 * Checks if the result of an async Office operation was successful.
 */
export function isAsyncSucceeded<T>(result: Office.AsyncResult<T>): result is Office.AsyncResult<T> {
  return result.status === Office.AsyncResultStatus.Succeeded;
}

/**
 * Removes the current finding from the list and updates the menu.
 * If no findings are left, the buttons and inputs are cleared.
 */
export function removeFromFindings() {
  if (removeCurrentFinding()) {
    resetUI();
    showStatus(domRefs, "Alle Treffer wurden verarbeitet.");
  } else {
    updateSelectionMenu();
  }
}

/**
 * Moves to the previous word in the findings list.
 * Updates the menu accordingly.
 */
export function goToPreviousMatch() {
  if (moveToPreviousFinding()) {
    updateSelectionMenu();
  }
}

/**
 * Moves to the next word in the findings list.
 * Updates the menu accordingly.
 */
export function goToNextMatch() {
  if (moveToNextFinding()) {
    updateSelectionMenu();
  }
}

/**
 * Disables the buttons and clears the input fields.
 * This is used when there are no findings left.
 */
function resetUI() {
  if (!ensureDomRefs()) {
    return;
  }

  toggleButtons(domRefs, true, state.currentIndex, findings().length, false);
  clearInputs(domRefs);
}

// Initialize the Office add-in when it's ready.
function initializeTaskpane() {
  const start = () => {
    if (hasRequiredDomElements()) {
      setup();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
    return;
  }

  start();
}

Office.onReady((info) => {
  setHostType(info.host);
  switch (state.hostType) {
    case Office.HostType.Word:
    case Office.HostType.Excel:
    case Office.HostType.PowerPoint:
    case Office.HostType.Outlook:
      initializeTaskpane();
      break;
    default:
      console.log("Unsupported host application: " + info.host);
      break;
  }
});
