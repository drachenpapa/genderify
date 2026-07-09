# Architecture – Genderify

> This document describes the **actual current architecture** of the repository.
> It is intended for human maintainers and AI coding agents.
> Every statement is based on the source code. Assumptions are marked explicitly.

---

## Project Overview

Genderify is a small open-source TypeScript project with two independent frontends that share a common core library:

1. **Microsoft Office Add-in** – a task pane that integrates into Word, Excel, PowerPoint, and Outlook via the Office.js API.
2. **Web Tool** – a standalone static webpage served at `https://genderify.vercel.app`.

Both frontends perform the same task: scan a piece of German text for gender-specific terms and offer the user gender-neutral or gendered alternative wordings. The gender dictionary contains approximately 8,000 entries.

The project is deployed via Vercel. The static build artefacts in `public/dist/` are the deployment target.

---

## Main Responsibilities

| Responsibility                                  | Where it lives                       |
|-------------------------------------------------|--------------------------------------|
| Scan text for gendered words                    | `src/core/textAnalyzer.ts`           |
| Replace a word in text (regex-safe)             | `src/core/textAnalyzer.ts`           |
| Drive the Office Add-in UI and Office API calls | `src/taskpane/genderify.ts`          |
| Drive the web frontend UI                       | `src/web/script.ts`                  |
| Gender dictionary data                          | `src/taskpane/genderDictionary.json` |
| Office command handler (Outlook button)         | `src/commands/commands.ts`           |
| Build configuration                             | `webpack.config.js`                  |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        src/core/                                │
│   textAnalyzer.ts   ←  shared scan/replace/sanitize logic      │
│   Finding interface ←  canonical data type                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ imported by both frontends
               ┌───────────────┴────────────────┐
               ▼                                ▼
   src/taskpane/genderify.ts          src/web/script.ts
   Office Add-in (GenderifyApp)       Web Tool (plain TS module)
   ┌──────────────────────────┐       ┌──────────────────────────┐
   │ reads/writes Office doc  │       │ reads/writes <textarea>  │
   │ via Office.js API        │       │ no external API calls    │
   │ supports Word/Excel/PPT/ │       │                          │
   │ Outlook                  │       │                          │
   └──────────────────────────┘       └──────────────────────────┘
               │                                │
               ▼                                ▼
   public/dist/taskpane.js             public/dist/web.js
   public/dist/genderify.html          public/index.html (static)
```

Both bundles are produced by the same Webpack config. The web tool dictionary is bundled statically into `web.js`; the Office Add-in dictionary is bundled into `taskpane.js`. No HTTP fetch is required at runtime.

---

## Directory Structure

```
genderify/
├── src/
│   ├── core/
│   │   └── textAnalyzer.ts       # Shared pure-function library
│   ├── taskpane/
│   │   ├── genderify.ts          # Office Add-in app class + Office.onReady
│   │   ├── genderify.html        # Add-in task pane HTML template
│   │   ├── genderify.css         # Add-in styles
│   │   ├── enums.ts              # DOM element IDs as enums
│   │   └── genderDictionary.json # ~8,000 German word entries
│   ├── web/
│   │   └── script.ts             # Web tool logic
│   ├── commands/
│   │   ├── commands.ts           # Office Add-in command handler
│   │   └── commands.html         # Required HTML stub for FunctionFile
│   └── __tests__/
│       ├── genderify.test.ts     # GenderifyApp integration tests
│       ├── textAnalyzer.test.ts  # Core module unit tests
│       └── mocks.ts              # Office API mock
├── public/
│   ├── index.html                # Web tool static HTML (not processed by Webpack)
│   ├── styles.css                # Web tool styles
│   ├── script.js                 # DEPRECATED – replaced by src/web/script.ts
│   └── dist/                    # Webpack build output (git-ignored in typical setup)
├── manifests/
│   ├── manifest-office.xml       # Add-in manifest for Word/Excel/PowerPoint
│   └── manifest-outlook.xml      # Add-in manifest for Outlook
├── assets/                       # Icons (png) for the add-in
├── docs/                         # Project documentation
├── webpack.config.js
├── tsconfig.json                 # Main TypeScript config (noEmit; Webpack drives the build)
├── tsconfig.jest.json            # TypeScript config override for Jest (CommonJS output)
├── babel.config.json             # Babel preset for TypeScript (used by Webpack)
└── jest.config.cjs               # Active Jest configuration
```

---

## Entry Points

### Office Add-in

**Runtime entry**: `src/taskpane/genderify.ts`

The module-level `Office.onReady` callback at the bottom of the file is the single entry point:

```typescript
Office.onReady((info) => {
  new GenderifyApp().initialize(info.host);
});
```

`initialize()` determines the host application (Word/Excel/PowerPoint/Outlook) and calls `setup()`, which wires up DOM element references and event listeners.

**Webpack entry**: `polyfill` (core-js + regenerator-runtime) is bundled as a separate chunk and loaded alongside `taskpane` in the generated `genderify.html`.

### Office Add-in Commands

**Runtime entry**: `src/commands/commands.ts`

Registers a single function `action()` via `Office.actions.associate`. This function is referenced by the `ActionButton` in `manifest-outlook.xml`. Currently it only shows a placeholder notification message.

### Web Tool

**Runtime entry**: `src/web/script.ts`

A single `DOMContentLoaded` event listener wires up all element references and click handlers. No framework. No external API calls.

### Static Web Page

`public/index.html` is the HTML shell for the web tool. It is **not** processed by Webpack. It references `./dist/web.js` (Webpack output) via a plain `<script>` tag.

---

## Data Flow

### Office Add-in

```
User selects text in Office app
        │
        ▼
[Analyze button click]
        │
        ▼
GenderifyApp.analyzeSelectedText()
  → Office.context.document.getSelectedDataAsync()  (or mailbox.item.body.getAsync for Outlook)
        │
        ▼
GenderifyApp.scanText(text)
  → core.scanText(text, genderDictionary)
  → returns Finding[]
        │
        ▼
GenderifyApp.updateSelectionMenu()
  → populates foundWord input, alternatives <select>, gendered form input
  → updates progress indicator ("1 / 3")
        │
        ▼
User picks an alternative and clicks ✔️
        │
        ▼
GenderifyApp.replaceWordInDocument(inputId)
  → reads replacement value from the DOM input
  → GenderifyApp.rewriteDocument(replacementWord)
      → getSelectedDataAsync() to re-fetch current text
      → core.replaceInText(text, wordToReplace, replacement)
      → setSelectedDataAsync() / mailbox.item.body.setAsync() to write back
  → GenderifyApp.removeFromFindings()
  → GenderifyApp.updateSelectionMenu() or resetUI()
```

### Web Tool

The flow is identical in logic but uses a `<textarea>` instead of the Office document API:

```
User types/pastes text into <textarea>
        │
[Analyze button click]
        │
core.scanText(textInput.value, genderDictionary) → Finding[]
        │
updateFinding() populates the UI
        │
User picks alternative → replaceInText() rewrites textInput.value in place
        │
updateFindingsAfterApply() → updates UI
```

---

## Core Module: `src/core/textAnalyzer.ts`

Three exported pure functions, no side effects, no dependencies:

| Function                                 | Purpose                                                                                                                                                            |
|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sanitizeRegex(str)`                     | Escapes regex special characters so dictionary words can safely be used in `RegExp` constructors                                                                   |
| `scanText(text, dictionary)`             | Tokenises text, lowercases, strips punctuation `.,;:!?()`, looks up each token in the dictionary; deduplicates by canonical word form; returns ordered `Finding[]` |
| `replaceInText(text, word, replacement)` | Whole-word, case-insensitive replacement using a sanitised `RegExp`                                                                                                |

The `Finding` interface is the canonical data type shared by both frontends:

```typescript
interface Finding {
  word: string;            // Display form (e.g., "Mitarbeiter")
  genderNeutralWords: string[];  // One or more alternatives
  genderBaseForm?: string; // If set, used to construct the gendered form (base + char + "innen")
}
```

---

## `GenderifyApp` Class (`src/taskpane/genderify.ts`)

All Office Add-in state and UI logic is encapsulated in this class. There are no module-level mutable variables.

**Private state:**

| Field                  | Type                     | Purpose                            |
|------------------------|--------------------------|------------------------------------|
| `_findings`            | `Finding[]`              | Current list of matches            |
| `_currentIndex`        | `number`                 | Which finding is displayed         |
| `_hostType`            | `Office.HostType`        | Determines which Office API to use |
| DOM element references | `HTMLButtonElement` etc. | Held after `setupHtmlElements()`   |

**Public API (used directly in tests):**

- `initialize(host)` – called from `Office.onReady`
- `setup()` – wires DOM + listeners
- `setupHtmlElements()` – (re-)acquires DOM references; callable in tests after DOM is injected
- `findings` getter – read-only access to current findings
- `scanText(text)` – runs analysis and updates UI
- `updateSelectionMenu()` – refreshes UI for current finding
- `replaceWordInDocument(inputId)` – reads from DOM, triggers rewrite
- `removeFromFindings()` – removes current entry, advances or resets
- `goToNextMatch()` / `goToPreviousMatch()` – navigation

**Host-specific branching** is isolated to two private methods (`getSelectedData`, `setSelectedData`), each with a single `if (hostType === Outlook)` check. All other methods are host-agnostic.

---

## DOM Element IDs

All HTML element IDs are declared in `src/taskpane/enums.ts` as TypeScript enums. This is the single source of truth for ID strings across the TypeScript codebase.

```
ButtonIds   – AnalyzeButton, ApplyGenderNeutral, ApplyGendered, PrevButton, NextButton
InputIds    – GenderChar, FoundWord, GenderedWord
SelectionIds – GenderNeutralWord
DisplayIds  – Progress, StatusMessage
```

The web frontend (`src/web/script.ts`) does not import these enums; it uses the same string values directly, which are identical to the HTML `id` attributes in `public/index.html`.

---

## Dictionary (`src/taskpane/genderDictionary.json`)

- ~8,000 entries, ~176 KiB
- JSON object keyed by **lowercase** form of the German word (lookup key)
- Each value is a `Finding` object
- The same JSON file is imported statically by both `genderify.ts` and `src/web/script.ts` and bundled at build time
- A word may have an empty `genderBaseForm` (`""`) if a gendered form (with Genderzeichen) is not applicable

---

## Build System

### Webpack (`webpack.config.js`)

Four entry points produce four output files in `public/dist/`:

| Entry      | Output        | Purpose                                  |
|------------|---------------|------------------------------------------|
| `polyfill` | `polyfill.js` | `core-js/stable` + `regenerator-runtime` |
| `taskpane` | `taskpane.js` | Office Add-in logic                      |
| `commands` | `commands.js` | Office command handler                   |
| `web`      | `web.js`      | Web tool logic                           |

TypeScript is transpiled by **Babel** (`babel-loader` + `@babel/preset-typescript`). Type checking is **not** performed during the Webpack build; it is done separately via `tsc --noEmit`.

> ⚠️ Assumption: Because Babel strips types without checking them, a type error would not fail the Webpack build. Run `npm run build` (Webpack) and `npx tsc --noEmit` as separate steps to get a complete safety check.

The production build replaces the development URL (`https://localhost:3000/`) with the production URL (`https://genderify.vercel.app/`) in the copied manifest XML files.

### TypeScript

`tsconfig.json` is the IDE/type-checker config with `"noEmit": true`. `tsconfig.jest.json` extends it with `"module": "commonjs"` and `"noEmit": false` for Jest's CommonJS requirement.

---

## Office Manifests

| File                             | Hosts                                                        |
|----------------------------------|--------------------------------------------------------------|
| `manifests/manifest-office.xml`  | Word (Document), Excel (Workbook), PowerPoint (Presentation) |
| `manifests/manifest-outlook.xml` | Outlook (Mailbox)                                            |

Both manifests point to the production Vercel URL. The Webpack build transforms them by replacing the dev URL with the production URL.

The three host blocks in `manifest-office.xml` (Document, Presentation, Workbook) are structurally identical; this duplication is required by the Office manifest XML schema and cannot be eliminated without an external XML templating step.

---

## External Dependencies and Integrations

### Runtime

| Dependency            | Purpose                                                                                                |
|-----------------------|--------------------------------------------------------------------------------------------------------|
| `office.js` (CDN)     | Office API – loaded in `genderify.html` via a `<script>` tag pointing to `appsforoffice.microsoft.com` |
| `core-js`             | ES polyfills bundled as the `polyfill` entry                                                           |
| `regenerator-runtime` | Async/generator runtime polyfill                                                                       |

### Build / Dev

| Dependency                         | Purpose                                             |
|------------------------------------|-----------------------------------------------------|
| Webpack 5                          | Bundler                                             |
| Babel + `@babel/preset-typescript` | TypeScript transpilation in Webpack                 |
| `office-addin-dev-certs`           | Local HTTPS dev certificates                        |
| `office-addin-debugging`           | Start/stop add-in debugging                         |
| `office-addin-lint`                | ESLint + Prettier preset for Office add-ins         |
| Vercel                             | Deployment platform (serving `public/` as the root) |
| Renovate                           | Automated dependency updates                        |

### Testing

| Dependency               | Purpose                                                |
|--------------------------|--------------------------------------------------------|
| Jest 30                  | Test runner                                            |
| `ts-jest`                | TypeScript support in Jest (uses `tsconfig.jest.json`) |
| `jest-environment-jsdom` | Browser DOM simulation                                 |

---

## Configuration

| File                           | What it controls                                              |
|--------------------------------|---------------------------------------------------------------|
| `webpack.config.js`            | Build entries, loaders, plugins, dev server, URL substitution |
| `tsconfig.json`                | TypeScript compiler options for IDE and `tsc --noEmit`        |
| `tsconfig.jest.json`           | TypeScript overrides for Jest (CommonJS, emit enabled)        |
| `babel.config.json`            | Babel presets used by `babel-loader`                          |
| `jest.config.cjs`              | Jest configuration (active)                                   |
| `package.json` → `"config"`    | Dev server port and target app for `office-addin-debugging`   |
| `package.json` → `"overrides"` | Forced versions of transitive dependencies for security fixes |
| `package.json` → `"prettier"`  | Delegates Prettier config to `office-addin-prettier-config`   |

---

## Error Handling

Errors and user-facing messages are displayed via `GenderifyApp.showStatus(message, isError)`, which sets `textContent` and a CSS class (`"info"` or `"error"`) on `<p id="status-message" role="status">`. This element uses `role="status"` (which implies `aria-live="polite"`), so screen readers announce changes automatically.

`showStatus` and `clearStatus` are null-guarded: if `statusMessageElement` is not yet in the DOM (e.g., during module initialisation in tests), the call is silently skipped.

In the web tool, `resetUI(message?)` fulfils the same role for the "no results" state.

There are no unhandled promise rejections visible in the code. `replaceWordInDocument` wraps `rewriteDocument` in a `try/catch` and routes any exception to `showStatus`.

---

## Testing Approach

Test files live in `src/__tests__/`. Jest runs with `jsdom` as the environment.

### `textAnalyzer.test.ts`

Pure unit tests for `src/core/textAnalyzer.ts`. No mocks required. Tests cover `sanitizeRegex`, `scanText`, and `replaceInText` including edge cases (empty input, deduplication, punctuation stripping, word boundaries, regex-special characters in words).

### `genderify.test.ts`

Integration tests for `GenderifyApp`. Each test creates a fresh instance:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  app = new GenderifyApp();
  document.body.innerHTML = `<input id="genderChar" value="a" /> ...`;
  app.setupHtmlElements();
});
```

This pattern gives each test an isolated DOM and isolated state without shared globals. The Office API is replaced by a hand-written mock (`mocks.ts`) that is assigned to `global.Office` before the module is imported. `jest.clearAllMocks()` resets call counts between tests without removing mock implementations.

The `genderDictionary.json` import is mocked via `jest.mock(...)` with a minimal two-word dictionary (`he`, `she`).

### Coverage gaps (known)

- `src/web/script.ts` – no tests (only executable in a real browser context)
- `src/commands/commands.ts` – no tests
- Outlook-specific code paths in `getSelectedData`/`setSelectedData` – not tested
- Navigation edge cases with three or more findings

---

## Architectural Decisions Visible in the Code

### 1. Shared core, two frontends

`src/core/textAnalyzer.ts` is the single implementation of scanning and replacement logic. Both `genderify.ts` and `src/web/script.ts` import from it. This was introduced to eliminate the duplication that previously existed between the Office Add-in TypeScript and the web `public/script.js`.

### 2. Class encapsulation for the Office Add-in

`GenderifyApp` holds all state as private fields. This makes tests straightforward (`new GenderifyApp()` per test, no module-level state to reset), removes the need for test-only exports like `setFindings`, and makes the state lifecycle explicit via `initialize()` → `setup()` → event callbacks.

### 3. DOM element IDs as enums

All HTML element IDs used by the Office Add-in are declared in `src/taskpane/enums.ts`. This makes ID renames refactor-safe in TypeScript, is consistent across HTML, TypeScript, and tests, and serves as a central reference. The web tool uses the same string values but does not import the enums.

### 4. Babel for Webpack, ts-jest for tests

Webpack transpiles TypeScript via Babel (fast, no type checking). Tests use ts-jest (type-aware, uses a separate `tsconfig.jest.json`). The split is pragmatic: build speed vs. test correctness.

### 5. Dictionary bundled, not fetched

The dictionary is imported statically in both TypeScript modules and bundled into the JavaScript output. There is no runtime HTTP dependency on the dictionary. An earlier version of the web tool fetched it from a hardcoded production URL at runtime; that has been eliminated.

### 6. Inline status messages instead of `alert()`

All user-facing error and status messages are rendered in `<p id="status-message" role="status">`. This is non-modal, accessible (screen reader announced), and styleable. The approach is consistent across both frontends.

---

## Known Limitations and Technical Debt

| Item                                             | Impact   | Notes                                                                                                                                                                          |
|--------------------------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/web/script.ts` is not tested                | Medium   | The web tool logic is implicitly covered via the shared core tests, but the DOM wiring is untested                                                                             |
| `src/commands/commands.ts` is boilerplate        | Low      | The Outlook `ActionButton` calls `action()`, which only shows a placeholder notification. Either implement real functionality or remove the button from `manifest-outlook.xml` |
| `jest.config.ts` exists but is unused            | Low      | Superseded by `jest.config.cjs`. The file contains a deprecation comment and can be deleted                                                                                    |
| `public/script.js` exists but is unused          | Low      | Contains only a deprecation comment. Can be deleted                                                                                                                            |
| Manifest XML duplication                         | Low      | Three identical host blocks in `manifest-office.xml` are required by the XML schema                                                                                            |
| Thin test coverage for navigation/Outlook paths  | Low      | Only 15 tests for `GenderifyApp` out of many possible behaviours                                                                                                               |
| `genderDictionary.json` lives in `src/taskpane/` | Very low | Imported by both `taskpane` and `web` modules. Could be moved to `src/core/` but this is cosmetic                                                                              |

---

## What Should Stay Simple

- **No UI framework.** The UI is minimal (a handful of inputs, a select, a few buttons). Introducing React or similar would add significant overhead for no benefit.
- **No state management library.** `GenderifyApp` private fields are sufficient. The state is trivial.
- **No backend.** The dictionary is static. All processing is client-side. There is no reason to introduce a server.
- **No build pipeline beyond Webpack.** The current Webpack + Babel setup is straightforward. Avoid adding Vite, Rollup, or other bundlers.
- **No internationalisation framework.** The tool is German-language by design. UI strings are hardcoded in German.
- **No component library.** Plain HTML + CSS is appropriate for the add-in task pane size and the web tool's simple layout.
- **No routing.** Both frontends are single-screen applications.
