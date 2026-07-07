import GenderDictionary from "../taskpane/genderDictionary.json";
import { type Finding, scanText as coreScanText, replaceInText } from "../core/textAnalyzer";

const genderDictionary = GenderDictionary as unknown as Record<string, Finding>;

let findings: Finding[] = [];
let index = 0;

document.addEventListener("DOMContentLoaded", () => {
  const textInput = document.getElementById("textInput") as HTMLTextAreaElement;
  const genderChar = document.getElementById("genderChar") as HTMLInputElement;
  const analyzeButton = document.getElementById("analyze-button") as HTMLButtonElement;
  const foundWord = document.getElementById("foundWord") as HTMLInputElement;
  const genderNeutralWord = document.getElementById("genderNeutralWord") as HTMLSelectElement;
  const applyGenderNeutral = document.getElementById("applyGenderNeutral") as HTMLButtonElement;
  const genderedWord = document.getElementById("genderedWord") as HTMLInputElement;
  const applyGendered = document.getElementById("applyGendered") as HTMLButtonElement;
  const prevButton = document.getElementById("prev-button") as HTMLButtonElement;
  const nextButton = document.getElementById("next-button") as HTMLButtonElement;
  const progress = document.getElementById("progress") as HTMLSpanElement;
  const statusMessage = document.getElementById("status-message") as HTMLParagraphElement;

  analyzeButton.addEventListener("click", () => {
    findings = coreScanText(textInput.value, genderDictionary);
    index = 0;

    if (findings.length > 0) {
      clearStatus();
      updateFinding();
    } else {
      resetUI("Keine passenden Wörter gefunden.");
    }
  });

  applyGendered.addEventListener("click", () => {
    textInput.value = replaceInText(textInput.value, findings[index].word, genderedWord.value);
    updateFindingsAfterApply();
  });

  applyGenderNeutral.addEventListener("click", () => {
    textInput.value = replaceInText(textInput.value, findings[index].word, genderNeutralWord.value);
    updateFindingsAfterApply();
  });

  prevButton.addEventListener("click", () => {
    if (index > 0) {
      index--;
      updateFinding();
    }
  });

  nextButton.addEventListener("click", () => {
    if (index < findings.length - 1) {
      index++;
      updateFinding();
    }
  });

  function updateFinding() {
    const finding = findings[index];
    foundWord.value = finding.word;

    genderNeutralWord.innerHTML = "";
    finding.genderNeutralWords.forEach((neutral) => {
      const option = document.createElement("option");
      option.value = neutral;
      option.textContent = neutral;
      genderNeutralWord.appendChild(option);
    });

    if (finding.genderBaseForm) {
      genderedWord.value = `${finding.genderBaseForm}${genderChar.value}innen`;
      applyGendered.disabled = false;
    } else {
      genderedWord.value = "";
      applyGendered.disabled = true;
    }

    applyGenderNeutral.disabled = false;
    progress.textContent = `${index + 1} / ${findings.length}`;
    updateNavButtons();
  }

  function updateFindingsAfterApply() {
    findings.splice(index, 1);

    if (findings.length === 0) {
      resetUI();
    } else {
      index = Math.min(index, findings.length - 1);
      updateFinding();
    }
  }

  function resetUI(message?: string) {
    foundWord.value = "";
    genderNeutralWord.innerHTML = "";
    genderedWord.value = "";
    applyGendered.disabled = true;
    applyGenderNeutral.disabled = true;
    prevButton.disabled = true;
    nextButton.disabled = true;
    progress.textContent = "";

    if (message) {
      statusMessage.textContent = message;
      statusMessage.className = "status-message info";
    }
  }

  function clearStatus() {
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
  }

  function updateNavButtons() {
    prevButton.disabled = index === 0;
    nextButton.disabled = index >= findings.length - 1;
  }
});
