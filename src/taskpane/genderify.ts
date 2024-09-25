const genderDictionary: Record<string, string[]> = {
  "Abbrecherquote": ["Abbruchquote", ""],
  "Ableser": ["Ablesedienst", ""],
  "Absenderadresse": ["Absendeadresse", ""],
  "Absolventen": ["Alumni", "Absolvent"],
  "Abteilungsleiter": ["Abteilungsleitung", ""],
  "Akademiker": ["Studierte", "Akademiker"],
};

let findings: { word: string; index: number }[] = [];
let currentIndex = 0;

async function run() {
  await waitForDOM();
  setupEventListeners();
}

function waitForDOM(): Promise<void> {
  return new Promise<void>((resolve) => {
    document.addEventListener("DOMContentLoaded", () => {
      resolve();
    });
  });
}

function setupEventListeners() {
  const eventListeners = [
    { id: "analyze-button", handler: genderifyText },
    { id: "applyAlternative", handler: () => applyWord("alternativeWord") },
    { id: "applyGendered", handler: () => applyWord("genderedWord") },
    { id: "prev-button", handler: previousWord },
    { id: "next-button", handler: nextWord }
  ];

  eventListeners.forEach(({ id, handler }) => {
    document.getElementById(id)?.addEventListener("click", handler);
  });
}

function genderifyText() {
  Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      scanText(result.value as string);
    } else {
      alert("Fehler beim Abrufen des ausgewählten Textes.");
    }
  });
}

function scanText(text: string) {
  findings = text.split(/\s+/).reduce((acc, word, index) => {
    const cleanWord = word.replace(/[.,;:!?()]/g, "");
    if (genderDictionary[cleanWord]) {
      acc.push({ word: cleanWord, index });
    }
    return acc;
  }, [] as { word: string; index: number }[]);

  if (findings.length > 0) {
    currentIndex = 0;
    updateSelectionMenu();
    document.getElementById("selection").style.display = "block";
  } else {
    alert("Keine passenden Wörter gefunden.");
  }
}

function updateSelectionMenu() {
  const { word } = findings[currentIndex];
  const genderCharInput = document.getElementById("genderChar") as HTMLInputElement;
  const foundWordInput = document.getElementById("foundWord") as HTMLInputElement;
  const alternativeWordInput = document.getElementById("alternativeWord") as HTMLInputElement;
  const genderedWordInput = document.getElementById("genderedWord") as HTMLInputElement;
  const applyAlternativeButton = document.getElementById("applyAlternative") as HTMLButtonElement;
  const applyGenderedButton = document.getElementById("applyGendered") as HTMLButtonElement;
  const prevButton = document.getElementById("prev-button") as HTMLButtonElement;
  const nextButton = document.getElementById("next-button") as HTMLButtonElement;

  foundWordInput.value = word;
  alternativeWordInput.value = genderDictionary[word][0];

  const genderedVariant = genderDictionary[word][1];
  const hasGenderedVariant = !!genderedVariant;

  applyAlternativeButton.disabled = false;
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === findings.length - 1;

  if (hasGenderedVariant) {
    genderedWordInput.value = `${genderedVariant}${genderCharInput.value}innen`;
  } else {
    genderedWordInput.value = "";
  }
  applyGenderedButton.disabled = !hasGenderedVariant;
}

function applyWord(inputId: string) {
  const wordInput = document.getElementById(inputId) as HTMLInputElement;
  if (!wordInput.value) return;
  rewriteDocument(wordInput.value);
  removeFromFindings();
}

function rewriteDocument(replacementWord: string) {
  const wordToReplace = findings[currentIndex].word;

  Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
    if (!isAsyncSucceeded(result)) return;

    const updatedText = (result.value as string).replace(new RegExp(`\\b${wordToReplace}\\b`, "gi"), replacementWord);
    Office.context.document.setSelectedDataAsync(updatedText, (asyncResult) => {
      if (!isAsyncSucceeded(asyncResult)) alert("Fehler beim Ersetzen des Wortes.");
    });
  });
}

function isAsyncSucceeded(result: Office.AsyncResult<any>) {
  return result.status === Office.AsyncResultStatus.Succeeded;
}


function removeFromFindings() {
  findings.splice(currentIndex, 1);
  if (findings.length === 0) {
  } else {
    currentIndex = Math.min(currentIndex, findings.length - 1);
    updateSelectionMenu();
  }
}

function previousWord() {
  if (currentIndex > 0) {
    currentIndex--;
    updateSelectionMenu();
  }
}

function nextWord() {
  if (currentIndex < findings.length - 1) {
    currentIndex++;
    updateSelectionMenu();
  }
}

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    run();
  }
});
