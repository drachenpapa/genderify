const genderDictionary: { [key: string]: string[] } = {
  "Abbrecherquote": ["Abbruchquote", ""],
  "Ableser": ["Ablesedienst", ""],
  "Akademiker": ["Studierte", "Akademiker"],
  // Füge hier weitere Wörter hinzu
};

let highlightedWords: { word: string; index: number }[] = [];
let currentIndex = 0;

async function run() {
  await new Promise((resolve) => {
    document.addEventListener("DOMContentLoaded", resolve);
  });

  document.getElementById("genderify-button")?.addEventListener("click", genderifyText);
  document.getElementById("applyAlternative")?.addEventListener("click", applyAlternative);
  document.getElementById("applyGendered")?.addEventListener("click", applyGendered);
  document.getElementById("prev-button")?.addEventListener("click", previousWord);
  document.getElementById("next-button")?.addEventListener("click", nextWord);
  console.log("Run function initialized and event listeners set.");
}

function genderifyText() {
  console.log("Genderify button clicked.");
  Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      const selectedText = result.value as string;
      console.log("Selected text:", selectedText);
      highlightWords(selectedText);
    } else {
      console.error("Failed to get selected text: " + result.error.message);
    }
  });
}

function highlightWords(text: string) {
  console.log("Highlighting words in the text:", text);
  const words = text.split(/\s+/);
  highlightedWords = [];

  words.forEach((word, index) => {
    const cleanWord = word.replace(/[.,;:!?()]/g, "");
    if (genderDictionary[cleanWord]) {
      highlightedWords.push({ word: cleanWord, index });
      console.log("Highlighted word found:", cleanWord);
    }
  });

  if (highlightedWords.length > 0) {
    currentIndex = 0;
    console.log("Highlighted words:", highlightedWords);
    updateOutput();
    document.getElementById("output").style.display = "block";
  } else {
    console.log("No matching words found.");
    alert("Keine passenden Wörter gefunden.");
  }
}

function updateOutput() {
  const { word } = highlightedWords[currentIndex];

  const alternativeWordInput = document.getElementById("alternativeWord") as HTMLInputElement;
  const genderedWordInput = document.getElementById("genderedWord") as HTMLInputElement;
  const genderCharInput = document.getElementById("genderChar") as HTMLInputElement;

  alternativeWordInput.value = genderDictionary[word][0];
  console.log("Alternative word set to:", alternativeWordInput.value);

  const genderedVariant = genderDictionary[word][1];
  if (genderedVariant) {
    genderedWordInput.value = `${genderedVariant}${genderCharInput.value}innen`;
    console.log("Gendered word set to:", genderedWordInput.value);
    document.getElementById("genderedVariantContainer").style.display = "flex";
  } else {
    genderedWordInput.value = '';
    console.log("No gendered variant available for:", word);
    document.getElementById("genderedVariantContainer").style.display = "none";
  }
}

function applyAlternative() {
  const alternativeWordInput = document.getElementById("alternativeWord") as HTMLInputElement;
  const selectedWord = alternativeWordInput.value;
  console.log("Applying alternative word:", selectedWord);
  replaceWordInDocument(selectedWord);
  removeWordFromList();
}

function applyGendered() {
  const genderedWordInput = document.getElementById("genderedWord") as HTMLInputElement;
  const selectedWord = genderedWordInput.value;
  console.log("Applying gendered word:", selectedWord);
  replaceWordInDocument(selectedWord);
  removeWordFromList();
}

function replaceWordInDocument(replacementWord: string) {
  const wordToReplace = highlightedWords[currentIndex].word;
  Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      const selectedText = result.value as string;
      const regex = new RegExp(wordToReplace, 'gi');
      const updatedText = selectedText.replace(regex, replacementWord);
      console.log("Replacing word:", wordToReplace, "with:", replacementWord);
      Office.context.document.setSelectedDataAsync(updatedText, (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
          console.log("Word successfully replaced.");
        } else {
          console.error("Failed to replace word: " + asyncResult.error.message);
        }
      });
    } else {
      console.error("Failed to get selected text: " + result.error.message);
    }
  });
}

function removeWordFromList() {
  highlightedWords.splice(currentIndex, 1);

  if (highlightedWords.length === 0) {
    document.getElementById("output").style.display = "none";
    console.log("No more words to replace.");
  } else {
    if (currentIndex >= highlightedWords.length) {
      currentIndex = highlightedWords.length - 1;
    }
    console.log("Remaining highlighted words:", highlightedWords);
    updateOutput();
  }
}

function previousWord() {
  if (currentIndex > 0) {
    currentIndex--;
    console.log("Navigating to previous word. Current index:", currentIndex);
    updateOutput();
  }
}

function nextWord() {
  if (currentIndex < highlightedWords.length - 1) {
    currentIndex++;
    console.log("Navigating to next word. Current index:", currentIndex);
    updateOutput();
  }
}

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    run();
    console.log("Office Add-in ready.");
  }
});
