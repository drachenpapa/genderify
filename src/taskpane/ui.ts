import { ButtonIds, InputIds, SelectionIds } from "./enums";
import type { FindingType } from "./types";

export interface DomRefs {
  applyGenderNeutralButton: HTMLButtonElement;
  applyGenderedButton: HTMLButtonElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  genderCharInput: HTMLInputElement;
  foundWordInput: HTMLInputElement;
  genderedWordInput: HTMLInputElement;
  genderNeutralWordSelect: HTMLSelectElement;
  statusMessage: HTMLDivElement;
}

export const STATUS_MESSAGE_ID = "status-message";

interface TaskpaneHandlers {
  analyzeSelectedText: () => void | Promise<void>;
  applyGenderNeutral: () => void;
  applyGendered: () => void;
  goToPreviousMatch: () => void;
  goToNextMatch: () => void;
}

export function createDomRefs(): DomRefs {
  return {
    applyGenderNeutralButton: getRequiredElement<HTMLButtonElement>(ButtonIds.ApplyGenderNeutral),
    applyGenderedButton: getRequiredElement<HTMLButtonElement>(ButtonIds.ApplyGendered),
    prevButton: getRequiredElement<HTMLButtonElement>(ButtonIds.PrevButton),
    nextButton: getRequiredElement<HTMLButtonElement>(ButtonIds.NextButton),
    genderCharInput: getRequiredElement<HTMLInputElement>(InputIds.GenderChar),
    foundWordInput: getRequiredElement<HTMLInputElement>(InputIds.FoundWord),
    genderedWordInput: getRequiredElement<HTMLInputElement>(InputIds.GenderedWord),
    genderNeutralWordSelect: getRequiredElement<HTMLSelectElement>(SelectionIds.GenderNeutralWord),
    statusMessage: getRequiredElement<HTMLDivElement>(STATUS_MESSAGE_ID),
  };
}

export function bindTaskpaneEventListeners(domRefs: DomRefs, handlers: TaskpaneHandlers): void {
  document.getElementById(ButtonIds.AnalyzeButton)?.addEventListener("click", handlers.analyzeSelectedText as EventListener);
  domRefs.applyGenderNeutralButton.addEventListener("click", handlers.applyGenderNeutral);
  domRefs.applyGenderedButton.addEventListener("click", handlers.applyGendered);
  domRefs.prevButton.addEventListener("click", handlers.goToPreviousMatch);
  domRefs.nextButton.addEventListener("click", handlers.goToNextMatch);
}

export function hasRequiredDomElements(): boolean {
  return [
    ButtonIds.ApplyGenderNeutral,
    ButtonIds.ApplyGendered,
    ButtonIds.PrevButton,
    ButtonIds.NextButton,
    InputIds.GenderChar,
    InputIds.FoundWord,
    InputIds.GenderedWord,
    SelectionIds.GenderNeutralWord,
    STATUS_MESSAGE_ID,
  ].every((id) => document.getElementById(id) !== null);
}

export function showStatus(domRefs: DomRefs | undefined, message: string, level: "info" | "error" = "info"): void {
  if (!domRefs?.statusMessage) {
    return;
  }

  domRefs.statusMessage.textContent = message;
  domRefs.statusMessage.className = `status-message status-${level}`;
}

export function clearStatus(domRefs: DomRefs | undefined): void {
  if (!domRefs?.statusMessage) {
    return;
  }

  domRefs.statusMessage.textContent = "";
  domRefs.statusMessage.className = "status-message";
}

export function renderFinding(domRefs: DomRefs, finding: FindingType, genderedVariant: string): void {
  domRefs.foundWordInput.value = finding.word;

  domRefs.genderNeutralWordSelect.innerHTML = "";
  finding.genderNeutralWords.forEach((neutralWord) => {
    const option = document.createElement("option");
    option.value = neutralWord;
    option.text = neutralWord;
    domRefs.genderNeutralWordSelect.appendChild(option);
  });

  domRefs.genderedWordInput.value = genderedVariant;
}

export function toggleButtons(
  domRefs: DomRefs,
  disabled: boolean,
  currentIndex: number,
  findingsLength: number,
  hasGenderedVariant: boolean,
): void {
  domRefs.applyGenderNeutralButton.disabled = disabled;
  domRefs.applyGenderedButton.disabled = disabled || !hasGenderedVariant;
  domRefs.genderNeutralWordSelect.disabled = disabled;
  domRefs.prevButton.disabled = disabled || currentIndex === 0;
  domRefs.nextButton.disabled = disabled || currentIndex === findingsLength - 1;
}

export function clearInputs(domRefs: DomRefs): void {
  domRefs.foundWordInput.value = "";
  domRefs.genderNeutralWordSelect.value = "";
  domRefs.genderedWordInput.value = "";
}

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Fehlendes UI-Element: ${id}`);
  }

  return element as T;
}
