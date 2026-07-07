import { ButtonIds, InputIds, SelectionIds, DisplayIds } from "./enums";
import GenderDictionary from "./genderDictionary.json";
import { type Finding, scanText as coreScanText, replaceInText } from "../core/textAnalyzer";

const genderDictionary = GenderDictionary as unknown as Record<string, Finding>;

/**
 * Checks if the result of an async Office operation was successful.
 *
 * @param result - The result of an Office operation.
 * @returns True if the operation succeeded, false otherwise.
 */
export function isAsyncSucceeded(result: Office.AsyncResult<any>): boolean {
  return result.status === Office.AsyncResultStatus.Succeeded;
}

/**
 * Encapsulates all state and UI logic for the Genderify task pane.
 *
 * Each call to Office.onReady creates one instance of this class.
 * Tests can create isolated instances with fresh state without needing
 * a separate state-reset helper.
 */
export class GenderifyApp {
  private _findings: Finding[] = [];
  private _currentIndex = 0;
  private _hostType!: Office.HostType;

  private applyGenderNeutralButton!: HTMLButtonElement;
  private applyGenderedButton!: HTMLButtonElement;
  private prevButton!: HTMLButtonElement;
  private nextButton!: HTMLButtonElement;
  private genderCharInput!: HTMLInputElement;
  private foundWordInput!: HTMLInputElement;
  private genderedWordInput!: HTMLInputElement;
  private genderNeutralWordSelect!: HTMLSelectElement;
  private progressElement!: HTMLSpanElement;
  private statusMessageElement!: HTMLParagraphElement;

  /** Read-only access to the current findings list. */
  get findings(): Finding[] {
    return this._findings;
  }

  /**
   * Initializes the add-in for the given Office host.
   * Called from the Office.onReady callback.
   */
  initialize(host: Office.HostType): void {
    this._hostType = host;
    switch (host) {
      case Office.HostType.Word:
      case Office.HostType.Excel:
      case Office.HostType.PowerPoint:
      case Office.HostType.Outlook:
        this.setup();
        break;
      default:
        console.log("Unsupported host application: " + host);
    }
  }

  /**
   * Runs the full UI setup: DOM element references and event listeners.
   */
  setup(): void {
    this.setupHtmlElements();
    this.setupEventListeners();
  }

  /**
   * Assigns DOM element references from the document.
   * May be called again after the DOM is (re-)populated, e.g. in tests.
   */
  setupHtmlElements(): void {
    this.applyGenderNeutralButton = document.getElementById(ButtonIds.ApplyGenderNeutral) as HTMLButtonElement;
    this.applyGenderedButton = document.getElementById(ButtonIds.ApplyGendered) as HTMLButtonElement;
    this.prevButton = document.getElementById(ButtonIds.PrevButton) as HTMLButtonElement;
    this.nextButton = document.getElementById(ButtonIds.NextButton) as HTMLButtonElement;
    this.genderCharInput = document.getElementById(InputIds.GenderChar) as HTMLInputElement;
    this.foundWordInput = document.getElementById(InputIds.FoundWord) as HTMLInputElement;
    this.genderedWordInput = document.getElementById(InputIds.GenderedWord) as HTMLInputElement;
    this.genderNeutralWordSelect = document.getElementById(SelectionIds.GenderNeutralWord) as HTMLSelectElement;
    this.progressElement = document.getElementById(DisplayIds.Progress) as HTMLSpanElement;
    this.statusMessageElement = document.getElementById(DisplayIds.StatusMessage) as HTMLParagraphElement;
  }

  private setupEventListeners(): void {
    document.getElementById(ButtonIds.AnalyzeButton)?.addEventListener("click", () => this.analyzeSelectedText());
    document.getElementById(ButtonIds.ApplyGenderNeutral)?.addEventListener("click", () => this.replaceWordInDocument(SelectionIds.GenderNeutralWord));
    document.getElementById(ButtonIds.ApplyGendered)?.addEventListener("click", () => this.replaceWordInDocument(InputIds.GenderedWord));
    document.getElementById(ButtonIds.PrevButton)?.addEventListener("click", () => this.goToPreviousMatch());
    document.getElementById(ButtonIds.NextButton)?.addEventListener("click", () => this.goToNextMatch());
  }

  /**
   * Retrieves the selected text from the document and scans it for gendered words.
   */
  analyzeSelectedText(): void {
    this.getSelectedData((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        this.scanText(result.value as string);
      } else {
        this.showStatus(`Fehler beim Abrufen des ausgewählten Textes: ${result.error.message}`, true);
      }
    });
  }

  /**
   * Scans the given text against the gender dictionary and updates the UI.
   *
   * @param text - The text to scan.
   */
  scanText(text: string): void {
    this._currentIndex = 0;
    this._findings = coreScanText(text, genderDictionary);

    if (this._findings.length > 0) {
      this.clearStatus();
      this.updateSelectionMenu();
    } else {
      this.showStatus("Keine passenden Wörter gefunden.");
    }
  }

  /**
   * Refreshes the selection menu with the current finding's data.
   */
  updateSelectionMenu(): void {
    const find = this._findings[this._currentIndex];
    this.foundWordInput.value = find.word;

    this.genderNeutralWordSelect.innerHTML = "";
    find.genderNeutralWords.forEach((neutralWord) => {
      const option = document.createElement("option");
      option.value = neutralWord;
      option.text = neutralWord;
      this.genderNeutralWordSelect.appendChild(option);
    });

    const genderedVariant = find.genderBaseForm;
    this.genderedWordInput.value = genderedVariant
      ? `${genderedVariant}${this.genderCharInput.value}innen`
      : "";

    if (this.progressElement) {
      this.progressElement.textContent = `${this._currentIndex + 1} / ${this._findings.length}`;
    }

    this.toggleButtons(false);
  }

  /**
   * Reads the replacement word from the given input element and applies it
   * to the document, then removes the current finding from the list.
   *
   * @param inputId - The DOM element ID of the input containing the replacement word.
   */
  async replaceWordInDocument(inputId: string): Promise<void> {
    const wordInput = document.getElementById(inputId) as HTMLInputElement;
    if (!wordInput.value) return;

    try {
      await this.rewriteDocument(wordInput.value);
      this.removeFromFindings();
    } catch (error) {
      this.showStatus(`Fehler beim Ersetzen des Wortes: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, true);
    }
  }

  private async rewriteDocument(replacementWord: string): Promise<void> {
    const wordToReplace = this._findings[this._currentIndex].word;

    const result = await new Promise<Office.AsyncResult<any>>((resolve) => {
      this.getSelectedData((asyncResult) => resolve(asyncResult));
    });

    if (!isAsyncSucceeded(result)) return;

    const updatedText = replaceInText(result.value as string, wordToReplace, replacementWord);

    const setAsyncResult = await new Promise<Office.AsyncResult<any>>((resolve) => {
      this.setSelectedData(updatedText, (asyncResult) => resolve(asyncResult));
    });

    if (!isAsyncSucceeded(setAsyncResult)) {
      this.showStatus("Fehler beim Ersetzen des Wortes.", true);
    }
  }

  /**
   * Removes the current finding and advances to the next one, or resets the UI
   * when all findings have been processed.
   */
  removeFromFindings(): void {
    this._findings.splice(this._currentIndex, 1);

    if (this._findings.length === 0) {
      this.resetUI();
    } else {
      this._currentIndex = Math.min(this._currentIndex, this._findings.length - 1);
      this.updateSelectionMenu();
    }
  }

  /** Navigates to the previous finding. */
  goToPreviousMatch(): void {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this.updateSelectionMenu();
    }
  }

  /** Navigates to the next finding. */
  goToNextMatch(): void {
    if (this._currentIndex < this._findings.length - 1) {
      this._currentIndex++;
      this.updateSelectionMenu();
    }
  }

  private resetUI(): void {
    this.toggleButtons(true);
    this.clearInputs();
    if (this.progressElement) this.progressElement.textContent = "";
  }

  /**
   * Displays a status or error message in the status area.
   * Uses a null guard so it is safe to call before the DOM is populated.
   *
   * @param message - The message to display.
   * @param isError - When true, renders as an error; otherwise as an info message.
   */
  private showStatus(message: string, isError = false): void {
    if (!this.statusMessageElement) return;
    this.statusMessageElement.textContent = message;
    this.statusMessageElement.className = `status-message ${isError ? "error" : "info"}`;
  }

  /** Clears the status message area. */
  private clearStatus(): void {
    if (!this.statusMessageElement) return;
    this.statusMessageElement.textContent = "";
    this.statusMessageElement.className = "status-message";
  }

  private toggleButtons(disabled: boolean): void {
    this.applyGenderNeutralButton.disabled = disabled;
    this.applyGenderedButton.disabled = disabled || !this.genderedWordInput.value;
    this.genderNeutralWordSelect.disabled = disabled;
    this.prevButton.disabled = disabled || this._currentIndex === 0;
    this.nextButton.disabled = disabled || this._currentIndex === this._findings.length - 1;
  }

  private clearInputs(): void {
    this.foundWordInput.value = "";
    this.genderNeutralWordSelect.value = "";
    this.genderedWordInput.value = "";
  }

  private getSelectedData(resolve: (result: Office.AsyncResult<any>) => void): void {
    if (this._hostType === Office.HostType.Outlook) {
      Office.context.mailbox.item?.body.getAsync(Office.CoercionType.Text, (asyncResult) => resolve(asyncResult));
    } else {
      Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (asyncResult) => resolve(asyncResult));
    }
  }

  private setSelectedData(updatedText: string, resolve: (result: Office.AsyncResult<any>) => void): void {
    if (this._hostType === Office.HostType.Outlook) {
      Office.context.mailbox.item?.body.setAsync(updatedText, (asyncResult) => resolve(asyncResult));
    } else {
      Office.context.document.setSelectedDataAsync(updatedText, (asyncResult) => resolve(asyncResult));
    }
  }
}

// Initialize the Office add-in when it's ready.
Office.onReady((info) => {
  new GenderifyApp().initialize(info.host);
});
