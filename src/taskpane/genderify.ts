import { ButtonIds, InputIds } from "./enums";
import GenderDictionary from './genderDictionary.json';

interface Finding {
  word: string;
  index: number;
}

let findings: Finding[] = [];
let currentIndex = 0;
let hostType: Office.HostType;

let applyGenderNeutralButton: HTMLButtonElement;
let applyGenderedButton: HTMLButtonElement;
let prevButton: HTMLButtonElement;
let nextButton: HTMLButtonElement;

let genderCharInput: HTMLInputElement;
let foundWordInput: HTMLInputElement;
let genderedWordInput: HTMLInputElement;

let genderNeutralWordSelect: HTMLSelectElement;

/**
 * Main function that runs when the Office app is ready.
 * It initializes the setup for HTML elements and event listeners.
 */
async function setup() {
  setupHtmlElements();
  setupEventListeners();
}

/**
 * Sets up HTML elements by assigning them to global variables.
 * This includes buttons, inputs, and select elements used in the UI.
 */
function setupHtmlElements() {
  applyGenderNeutralButton = document.getElementById(ButtonIds.ApplyGenderNeutral) as HTMLButtonElement;
  applyGenderedButton = document.getElementById(ButtonIds.ApplyGendered) as HTMLButtonElement;
  prevButton = document.getElementById(ButtonIds.PrevButton) as HTMLButtonElement;
  nextButton = document.getElementById(ButtonIds.NextButton) as HTMLButtonElement;

  genderCharInput = document.getElementById(InputIds.GenderChar) as HTMLInputElement;
  foundWordInput = document.getElementById(InputIds.FoundWord) as HTMLInputElement;
  genderedWordInput = document.getElementById(InputIds.GenderedWord) as HTMLInputElement;

  genderNeutralWordSelect = document.getElementById("genderNeutralWord") as HTMLSelectElement;
}

/**
 * Adds event listeners to the HTML buttons.
 * Each button is assigned a specific handler function that will be called on click.
 */
function setupEventListeners() {
  document.getElementById(ButtonIds.AnalyzeButton)?.addEventListener("click", analyzeSelectedText);
  document.getElementById(ButtonIds.ApplyGenderNeutral)?.addEventListener("click", () => replaceWordInDocument("genderNeutralWord"));
  document.getElementById(ButtonIds.ApplyGendered)?.addEventListener("click", () => replaceWordInDocument("genderedWord"));
  document.getElementById(ButtonIds.PrevButton)?.addEventListener("click", goToPreviousMatch);
  document.getElementById(ButtonIds.NextButton)?.addEventListener("click", goToNextMatch);
}

/**
 * Retrieves the selected text from the Word document and starts the analysis.
 * If the text is successfully retrieved, the scanText function is called
 * to look for gender-specific words.
 */
function analyzeSelectedText() {
  getSelectedData((result) => {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      scanText(result.value as string);
    } else {
      alert(`Fehler beim Abrufen des ausgewählten Textes: ${result.error.message}`);
    }
  });
}

/**
 * Scans the given text for words that are included in the gender dictionary
 * and stores the findings in the findings list.
 * The function uses a Set to avoid duplicate findings.
 *
 * @param {string} text - The text to scan.
 */
function scanText(text: string) {
  const foundWords = new Set<string>();

  findings = text.split(/\s+/).reduce((acc, word, index) => {
    const cleanWord = word.replace(/[.,;:!?()]/g, "");

    if (GenderDictionary[cleanWord] && !foundWords.has(cleanWord)) {
      foundWords.add(cleanWord);
      acc.push({ word: cleanWord, index });
    }
    return acc;
  }, [] as Finding[]);

  if (findings.length > 0) {
    currentIndex = 0;
    updateSelectionMenu();
    document.getElementById("selection").style.display = "block";
  } else {
    alert("Keine passenden Wörter gefunden.");
  }
}

/**
 * Updates the selection menu with the current word and its alternatives.
 * It enables or disables buttons based on the current state of findings.
 */
function updateSelectionMenu() {
  const { word } = findings[currentIndex];
  foundWordInput.value = word;

  genderNeutralWordSelect.innerHTML = "";

  const dictionaryEntry = GenderDictionary[word];

  dictionaryEntry.genderNeutralWords.forEach((neutralWord: string) => {
    const option = document.createElement("option");
    option.value = neutralWord;
    option.text = neutralWord;
    genderNeutralWordSelect.appendChild(option);
  });

  const genderedVariant = dictionaryEntry.genderForm;
  genderedWordInput.value = genderedVariant ? `${genderedVariant}${genderCharInput.value}innen` : "";

  applyGenderNeutralButton.disabled = false;
  genderNeutralWordSelect.disabled = false;
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === findings.length - 1;
  applyGenderedButton.disabled = !genderedVariant;
}

/**
 * Applies the selected word replacement in the document.
 *
 * @param {string} inputId - The ID of the input field containing the replacement word.
 * This function handles the replacement and updates the findings list.
 */
async function replaceWordInDocument(inputId: string) {
  const wordInput = document.getElementById(inputId) as HTMLInputElement;
  if (!wordInput.value) return;

  toggleButtons(true);

  try {
    await rewriteDocument(wordInput.value);
    removeFromFindings();
  } catch (error) {
    alert(`Fehler beim Ersetzen des Wortes: ${error.message}`);
  } finally {
    toggleButtons(false);
  }
}

/**
 * Rewrites the document by replacing the current word with a new one.
 *
 * @param {string} replacementWord - The word to replace the current finding with.
 */
async function rewriteDocument(replacementWord: string) {
  const wordToReplace = findings[currentIndex].word;

  const result = await new Promise<Office.AsyncResult<any>>((resolve) => {
    getSelectedData((asyncResult) => resolve(asyncResult));
  });

  if (!isAsyncSucceeded(result)) return;

  const updatedText = (result.value as string).replace(new RegExp(`\\b${wordToReplace}\\b`, "gi"), replacementWord);

  const setAsyncResult = await new Promise<Office.AsyncResult<any>>((resolve) => {
    setSelectedData(updatedText, (asyncResult) => resolve(asyncResult));
  });

  if (!isAsyncSucceeded(setAsyncResult)) {
    alert("Fehler beim Ersetzen des Wortes.");
  }
}

/**
 * Checks if the result of an async Office operation was successful.
 *
 * @param {Office.AsyncResult<any>} result - The result of an Office operation.
 * @returns {boolean} True if the operation was successful, false otherwise.
 */
function isAsyncSucceeded(result: Office.AsyncResult<any>): boolean {
  return result.status === Office.AsyncResultStatus.Succeeded;
}

/**
 * Removes the current finding from the list and updates the menu.
 * If no findings are left, the buttons and inputs are cleared.
 */
function removeFromFindings() {
  findings.splice(currentIndex, 1);
  if (findings.length === 0) {
    disableButtonsAndClearInputs();
  } else {
    currentIndex = Math.min(currentIndex, findings.length - 1);
    updateSelectionMenu();
  }
}

/**
 * Moves to the previous word in the findings list.
 * Updates the menu accordingly.
 */
function goToPreviousMatch() {
  if (currentIndex > 0) {
    currentIndex--;
    updateSelectionMenu();
  }
}

/**
 * Moves to the next word in the findings list.
 * Updates the menu accordingly.
 */
function goToNextMatch() {
  if (currentIndex < findings.length - 1) {
    currentIndex++;
    updateSelectionMenu();
  }
}

/**
 * Disables the buttons and clears the input fields.
 * This is used when there are no findings left.
 */
function disableButtonsAndClearInputs() {
  toggleButtons(true);
  clearInputs();
}

/**
 * Toggles the enabled/disabled state of buttons.
 *
 * @param {boolean} disabled - Whether to disable or enable the buttons.
 */
function toggleButtons(disabled: boolean) {
  applyGenderNeutralButton.disabled = disabled;
  applyGenderedButton.disabled = disabled || !genderedWordInput.value;
  prevButton.disabled = disabled || currentIndex === 0;
  nextButton.disabled = disabled || currentIndex === findings.length - 1;
}

/**
 * Clears the input fields.
 * This is used to reset the UI after processing.
 */
function clearInputs() {
  foundWordInput.value = "";
  genderNeutralWordSelect.value = "";
  genderedWordInput.value = "";
}

/**
 * Retrieves the selected data from the Office document based on the host type.
 *
 * @param {(result: Office.AsyncResult<any>) => void} resolve - The callback function to handle the result.
 */
function getSelectedData(resolve: (result: Office.AsyncResult<any>) => void) {
  switch (hostType) {
    case Office.HostType.Outlook:
      return Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, (asyncResult) => resolve(asyncResult));
    default:
      return Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (asyncResult) => resolve(asyncResult));
  }
}

/**
 * Sets the selected data in the Office document based on the host type.
 *
 * @param {string} updatedText - The text to be set in the document.
 * @param {(result: Office.AsyncResult<any>) => void} resolve - The callback function to handle the result.
 */
function setSelectedData(updatedText: string, resolve: (result: Office.AsyncResult<any>) => void) {
  switch (hostType) {
    case Office.HostType.Outlook:
      return Office.context.mailbox.item.body.setAsync(updatedText, (asyncResult) => resolve(asyncResult));
    default:
      return Office.context.document.setSelectedDataAsync(updatedText, (asyncResult) => resolve(asyncResult));
  }
}

// Initialize the Office add-in when it's ready.
Office.onReady((info) => {
  hostType = info.host;
  switch (hostType) {
    case Office.HostType.Word:
    case Office.HostType.Excel:
    case Office.HostType.PowerPoint:
    case Office.HostType.Outlook:
      setup();
      break;
    default:
      console.log("Unsupported host application: " + info.host);
      break;
  }
});
