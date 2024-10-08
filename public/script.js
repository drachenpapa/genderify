import genderDictionary from './dist/genderDictionary.json';

let findings = [];
let index = 0;

document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const genderChar = document.getElementById('genderChar');
    const analyzeButton = document.getElementById('analyze-button');
    const foundWord = document.getElementById('foundWord');
    const genderNeutralWord = document.getElementById('genderNeutralWord');
    const applyGenderNeutral = document.getElementById('applyGenderNeutral');
    const genderedWord = document.getElementById('genderedWord');
    const applyGendered = document.getElementById('applyGendered');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    analyzeButton.addEventListener('click', () => {
        findings = [];
        index = 0;
        const inputText = textInput.value.toLowerCase();

        const words = inputText.replace(/[.,!?;]*/g, '').split(' ');

        words.forEach(word => {
            if (genderDictionary[word] && !findings.includes(genderDictionary[word])) {
                findings.push(genderDictionary[word]);
            }
        });

        if (findings.length > 0) {
            updateFinding();
        } else {
            resetUI();
        }
    });

    applyGendered.addEventListener('click', () => {
        const inputText = textInput.value;
        const finding = findings[index];
        const genderedVariant = genderedWord.value;

        textInput.value = inputText.replace(new RegExp(`\\b${finding.word}\\b`, 'gi'), genderedVariant);
        updateFindingsAfterApply();
    });

    applyGenderNeutral.addEventListener('click', () => {
        const inputText = textInput.value;
        const finding = findings[index];
        const neutralVariant = genderNeutralWord.value;

        textInput.value = inputText.replace(new RegExp(`\\b${finding.word}\\b`, 'gi'), neutralVariant);
        updateFindingsAfterApply();
    });

    prevButton.addEventListener('click', () => {
        if (index > 0) {
            index--;
            updateFinding();
        }
    });

    nextButton.addEventListener('click', () => {
        if (index < findings.length - 1) {
            index++;
            updateFinding();
        }
    });

    function updateFinding() {
        const finding = findings[index];
        foundWord.value = finding.word;
        const genderBaseForm = finding.genderBaseForm;
        const neutralWords = finding.genderNeutralWords;

        genderNeutralWord.innerHTML = neutralWords.map(neutral => `<option value="${neutral}">${neutral}</option>`).join('');

        if (genderBaseForm) {
            genderedWord.value = genderBaseForm + genderChar.value + 'innen';
            applyGendered.disabled = false;
        } else {
            genderedWord.value = '';
            applyGendered.disabled = true;
        }

        updateNavButtons();
    }

    function updateFindingsAfterApply() {
        findings.splice(index, 1);

        if (findings.length === 0) {
            resetUI();
        } else {
            if (index >= findings.length) {
                index = findings.length - 1;
            }
            updateFinding();
        }
        updateNavButtons();
    }

    function resetUI() {
        foundWord.value = "Keine gefundenen Wörter";
        genderNeutralWord.innerHTML = '';
        genderedWord.value = '';
        applyGendered.disabled = true;
        applyGenderNeutral.disabled = true;
        prevButton.disabled = true;
        nextButton.disabled = true;
    }

    function updateNavButtons() {
        prevButton.disabled = index === 0;
        nextButton.disabled = index >= findings.length - 1;
    }
});
