// TODO: Auslagern
const genderDictionary: Record<string, string[]> = {
  "Abbrecherquote": ["Abbruchquote", ""],
  "Ableser": ["Ablesedienst", ""],
  "Absenderadresse": ["Absendeadresse", ""],
  "Absolventen": ["Alumni", "Absolvent"],
  "Abteilungsleiter": ["Abteilungsleitung", ""],
  "Akademiker": ["Studierte", "Akademiker"],
};

// TODO: Auslagern
enum ButtonIds {
  AnalyzeButton = "analyze-button",
  ApplyAlternative = "applyAlternative",
  ApplyGendered = "applyGendered",
  PrevButton = "prev-button",
  NextButton = "next-button",
}

// TODO: Auslagern
enum InputIds {
  GenderChar = "genderChar",
  FoundWord = "foundWord",
  AlternativeWord = "alternativeWord",
  GenderedWord = "genderedWord",
}

type Finding = {
  word: string;
  index: number;
};

let findings: Finding[] = [];
let currentIndex = 0;

let applyAlternativeButton: HTMLButtonElement;
let applyGenderedButton: HTMLButtonElement;
let prevButton: HTMLButtonElement;
let nextButton: HTMLButtonElement;

let genderCharInput: HTMLInputElement;
let foundWordInput: HTMLInputElement;
let alternativeWordInput: HTMLInputElement;
let genderedWordInput: HTMLInputElement;

/**
 * Main function that runs when the Office app is ready.
 */
async function run() {
  await waitForDOM();
  setupHtmlElements();
  setupEventListeners();
}

/**
 * Waits for the DOM to fully load.
 * @returns {Promise<void>} A promise that resolves when the DOM is ready.
 */
function waitForDOM(): Promise<void> {
  return new Promise<void>((resolve) => {
    document.addEventListener("DOMContentLoaded", () => {
      resolve();
    });
  });
}

/**
 * Sets up HTML elements by assigning them to global variables.
 */
function setupHtmlElements() {
  applyAlternativeButton = document.getElementById(ButtonIds.ApplyAlternative) as HTMLButtonElement;
  applyGenderedButton = document.getElementById(ButtonIds.ApplyGendered) as HTMLButtonElement;
  prevButton = document.getElementById(ButtonIds.PrevButton) as HTMLButtonElement;
  nextButton = document.getElementById(ButtonIds.NextButton) as HTMLButtonElement;

  genderCharInput = document.getElementById(InputIds.GenderChar) as HTMLInputElement;
  foundWordInput = document.getElementById(InputIds.FoundWord) as HTMLInputElement;
  alternativeWordInput = document.getElementById(InputIds.AlternativeWord) as HTMLInputElement;
  genderedWordInput = document.getElementById(InputIds.GenderedWord) as HTMLInputElement;
}

/**
 * Adds event listeners to the HTML buttons.
 */
function setupEventListeners() {
  const eventListeners = [
    { id: ButtonIds.AnalyzeButton, handler: analyzeSelectedText },
    { id: ButtonIds.ApplyAlternative, handler: () => replaceWordInDocument("alternativeWord") },
    { id: ButtonIds.ApplyGendered, handler: () => replaceWordInDocument("genderedWord") },
    { id: ButtonIds.PrevButton, handler: goToPreviousMatch },
    { id: ButtonIds.NextButton, handler: goToNextMatch },
  ];

  eventListeners.forEach(({ id, handler }) => {
    document.getElementById(id)?.addEventListener("click", handler);
  });
}

/**
 * Retrieves the selected text from the Word document and starts the analyzis.
 */
function analyzeSelectedText() {
  Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      scanText(result.value as string);
    } else {
      alert("Fehler beim Abrufen des ausgewählten Textes.");
    }
  });
}

/**
 * Scans the text for words that match the gender dictionary and stores findings.
 * @param {string} text - The text to scan.
 */
function scanText(text: string) {
  const foundWords = new Set<string>();

  findings = text.split(/\s+/).reduce((acc, word, index) => {
    const cleanWord = word.replace(/[.,;:!?()]/g, "");

    if (genderDictionary[cleanWord] && !foundWords.has(cleanWord)) {
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
 */
function updateSelectionMenu() {
  const { word } = findings[currentIndex];
  foundWordInput.value = word;
  alternativeWordInput.value = genderDictionary[word][0];

  const genderedVariant = genderDictionary[word][1];
  genderedWordInput.value = genderedVariant ? `${genderedVariant}${genderCharInput.value}innen` : "";

  applyAlternativeButton.disabled = false;
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === findings.length - 1;
  applyGenderedButton.disabled = !genderedVariant;
}

/**
 * Applies the selected word replacement in the document.
 * @param {string} inputId - The ID of the input field containing the replacement word.
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
 * @param {string} replacementWord - The word to replace the current finding with.
 */
async function rewriteDocument(replacementWord: string) {
  const wordToReplace = findings[currentIndex].word;

  const result = await new Promise<Office.AsyncResult<any>>((resolve) => {
    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (asyncResult) => resolve(asyncResult));
  });

  if (!isAsyncSucceeded(result)) return;

  const updatedText = (result.value as string).replace(new RegExp(`\\b${wordToReplace}\\b`, "gi"), replacementWord);

  const setAsyncResult = await new Promise<Office.AsyncResult<any>>((resolve) => {
    Office.context.document.setSelectedDataAsync(updatedText, (asyncResult) => resolve(asyncResult));
  });

  if (!isAsyncSucceeded(setAsyncResult)) {
    alert("Fehler beim Ersetzen des Wortes.");
  }
}

/**
 * Checks if the result of an async Office operation was successful.
 * @param {Office.AsyncResult<any>} result - The result of an Office operation.
 * @returns {boolean} True if the operation was successful, false otherwise.
 */
function isAsyncSucceeded(result: Office.AsyncResult<any>): boolean {
  return result.status === Office.AsyncResultStatus.Succeeded;
}

/**
 * Removes the current finding from the list and updates the menu.
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
 */
function goToPreviousMatch() {
  if (currentIndex > 0) {
    currentIndex--;
    updateSelectionMenu();
  }
}

/**
 * Moves to the next word in the findings list.
 */
function goToNextMatch() {
  if (currentIndex < findings.length - 1) {
    currentIndex++;
    updateSelectionMenu();
  }
}

/**
 * Disables the buttons and clears the input fields.
 */
function disableButtonsAndClearInputs() {
  toggleButtons(true);
  clearInputs();
}

/**
 * Toggles the enabled/disabled state of buttons.
 * @param {boolean} disabled - Whether to disable or enable the buttons.
 */
function toggleButtons(disabled: boolean) {
  applyAlternativeButton.disabled = disabled;
  applyGenderedButton.disabled = disabled || !genderedWordInput.value;
  prevButton.disabled = disabled || currentIndex === 0;
  nextButton.disabled = disabled || currentIndex === findings.length - 1;
}

/**
 * Clears the input fields.
 */
function clearInputs() {
  foundWordInput.value = "";
  alternativeWordInput.value = "";
  genderedWordInput.value = "";
}

// Initialize the Office add-in when it's ready.
Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    run();
  }
});
