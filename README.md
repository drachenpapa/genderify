# Genderify

Genderify is a Microsoft Word Add-In designed to identify gender-specific terms in texts and replace them with gender-neutral alternatives. This project aims to promote and implement gender-inclusive language in documents.

## 📦 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Features

- Replaces gender-specific terms with gender-neutral alternatives.
- Custom input for gender symbols.
- Easy integration into Microsoft Word via Office Add-In.

## 📥 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/username/genderify.git
   cd genderify
    ```
2. **Install dependencies**:
   Make sure you have Node.js and npm installed. Then install the required dependencies with:
   ```bash
   npm install
   ```
3. **Build the project**:
   Compile the TypeScript code:
   ```bash
    tsc
   ```
4. **Start the Add-In**:
   Launch the Add-In with:
   ```bash
   npm start
   ```


## 💻 Usage
1. Open Microsoft Word.
2. Load the Genderify Add-In through the “Add-Ins” menu.
3. Select the text you want to gender.
4. Enter your desired gender symbol in the corresponding field.
5. Click the “Genderify” button to gender the selected text.

## ⚙️ Configuration

The terms to be replaced are defined in the `genderDictionary.ts` file. You can customize this file to add more terms or modify existing ones.

### Example of `genderDictionary.ts`

```typescript
export const genderDictionary: { [key: string]: string[] } = {
    "Abbrecherquote": ["", "Abbruchquote"],
    "Ableser": ["", "Ablesedienst"],
    "Akademiker": ["Akademiker", "Studierte"],
    "\u00C4rzte": ["\u00C4rzt", "Mediziner"],
};
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or create a pull request to share your suggestions and improvements.

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/MyFeature
    ```
3. Make your changes and commit them:
    ```bash
    git commit -m "Added my feature"
     ```
4. Push to your branch:
    ```bash
    git push origin feature/MyFeature
    ```
5. Create a pull request.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
