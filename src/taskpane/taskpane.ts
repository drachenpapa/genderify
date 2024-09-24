// taskpane.ts

// import { genderDictionary } from './genderDictionary';

async function run() {
  await new Promise((resolve) => {
    document.addEventListener("DOMContentLoaded", resolve);
  });
  document.getElementById("genderify-button")?.addEventListener("click", genderifyText);
}


function genderifyText() {
  Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, function (result) {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      const selectedText = result.value as string;

      if (selectedText) {
        console.log("Original text: " + selectedText);
        const genderifiedText = replaceGenderWords(selectedText);
        console.log("Modified text: " + genderifiedText);

        Office.context.document.setSelectedDataAsync(genderifiedText, function (asyncResult) {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            console.log("Text successfully replaced.");
          } else {
            console.error("Failed to replace text: " + asyncResult.error.message);
          }
        });
      } else {
        console.log("No text selected.");
      }
    } else {
      console.error("Failed to get selected text: " + result.error.message);
    }
  });
}


function replaceGenderWords(text: string): string {
  const genderChar = (document.getElementById("genderChar") as HTMLInputElement).value;

  const genderDictionary: { [key: string]: string[] } = {
    "Abbrecherquote": ["", "Abbruchquote"],
    "Ableser": ["", "Ablesedienst"],
    "Akademiker": ["Akademiker", "Studierte"],
    "\u00C4rzte": ["\u00C4rzt", "Mediziner"],
  };

  console.log("Original text: ", text);

  Object.keys(genderDictionary).forEach((term) => {
    const alternatives = genderDictionary[term];
    // const genderedTerm = alternatives[0] + genderChar + "innen";
    const genderedTerm = alternatives[1];

    const regex = new RegExp(`\\b${term}\\b`, 'gi');

    text = text.replace(regex, genderedTerm);
  });

  console.log("Modified text: ", text);
  return text;
}


Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    run();
  }
});
