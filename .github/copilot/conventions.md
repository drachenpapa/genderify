# Conventions – Genderify

> This document captures the coding conventions used in this project.
> **Existing** conventions are derived from the source code.
> **Recommended** conventions fill observed gaps in a way that is consistent with the existing style.
> The distinction is marked in each section.

---

## General Coding Principles

**Existing**

- Write small, focused functions with a single responsibility.
- Prefer guard clauses and early returns over deeply nested `if`-blocks.
- Use `async/await` for promise-based code. Raw callback APIs (e.g., Office.js) are wrapped in `new Promise(resolve => …)` to allow `await` at the call site.
- Use TypeScript `type`-only imports (`import { type X }`) when the import is used purely as a type.
- Avoid `any` except where forced by an external API (e.g., `Office.AsyncResult<any>`).

**Recommended**

- Add a JSDoc comment to every exported function and every public class method. Skip JSDoc on private methods and trivial getters unless the behaviour is non-obvious.
- Prefer `const` over `let`. Only use `let` when the value must be reassigned.

---

## Project Structure

**Existing**

```
src/core/          Pure, shared business logic (no Office API, no DOM)
src/taskpane/      Office Add-in UI and Office API integration
src/web/           Web tool logic
src/commands/      Office Add-in command handler
src/__tests__/     All test files (flat directory)
public/            Static web files (index.html, styles.css)
public/dist/       Webpack output (build artefact; not edited by hand)
manifests/         Office manifest XML files
docs/              Project documentation
assets/            Add-in icon images
```

**Recommended**

- Keep `src/core/` free of all DOM and Office.js references. It must remain independently testable with no mocks.
- New functionality that is shared between the Office Add-in and the web tool goes in `src/core/`.
- New functionality specific to only one frontend goes in the corresponding subdirectory (`src/taskpane/` or `src/web/`).
- Do not create new top-level directories without a clear reason. The current flat structure is appropriate for this project size.

---

## Naming Conventions

**Existing**

| Thing                                       | Convention                          | Examples                                           |
|---------------------------------------------|-------------------------------------|----------------------------------------------------|
| TypeScript files                            | `camelCase.ts`                      | `textAnalyzer.ts`, `genderify.ts`                  |
| Interfaces                                  | `PascalCase`                        | `Finding`                                          |
| Classes                                     | `PascalCase`                        | `GenderifyApp`                                     |
| Enums                                       | `PascalCase` (name and values)      | `ButtonIds.AnalyzeButton`                          |
| Functions                                   | `camelCase`                         | `scanText`, `replaceInText`, `updateSelectionMenu` |
| Private class fields with significant state | `_camelCase` (leading underscore)   | `_findings`, `_currentIndex`, `_hostType`          |
| Private class fields for DOM references     | `camelCase` (no underscore)         | `prevButton`, `foundWordInput`                     |
| CSS classes                                 | `kebab-case`                        | `finding-container`, `status-message`, `sr-only`   |
| Test files                                  | `*.test.ts` inside `src/__tests__/` | `genderify.test.ts`                                |

**Observed inconsistency – HTML element IDs**

HTML element IDs are currently mixed: some use `kebab-case` (`analyze-button`, `prev-button`, `status-message`) and some use `camelCase` (`applyGenderNeutral`, `foundWord`, `genderChar`). This is an artefact of the project's history. The IDs are locked in the Office manifests and in the deployed HTML, so they should not be changed retroactively.

**Recommended – HTML element IDs going forward**

New element IDs should use `kebab-case` (e.g., `gender-char`, `found-word`). Always declare them in `src/taskpane/enums.ts` before using them in HTML or TypeScript.

---

## DOM Element ID Enums

**Existing**

All HTML element IDs used by the TypeScript code are declared as enum values in `src/taskpane/enums.ts`. This is the single source of truth.

```typescript
// src/taskpane/enums.ts
export enum ButtonIds { … }
export enum InputIds  { … }
export enum SelectionIds { … }
export enum DisplayIds { … }
```

**Rules**

- Never use a string literal for a DOM element ID in TypeScript code. Always reference the enum.
- When adding a new interactive element to the Office Add-in HTML, add its ID to the correct enum first.
- The web tool (`src/web/script.ts`) uses the same string values but does not import the enums. If the web tool grows significantly, consider importing the enums there too.

---

## Formatting and Style

**Existing (enforced by `office-addin-prettier-config` via Prettier)**

- TypeScript: 2-space indentation.
- HTML and CSS: 4-space indentation.
- Double quotes for strings in TypeScript.
- Semicolons at end of statements.
- Template literals for string interpolation (`` `${variable}` `` not `"" + variable`).

Run the formatter before committing:

```bash
npm run prettier
```

Run the linter:

```bash
npm run lint          # check
npm run lint:fix      # auto-fix
```

**Recommended**

- Do not configure Prettier or ESLint locally in individual files. All formatting rules come from `office-addin-prettier-config` and `eslint-plugin-office-addins`.
- `String.raw` template tags are required by the linter when building regex strings that contain backslashes. Use `String.raw`\b${…}\b`` instead of `"\\b" + …`.

---

## Error Handling

**Existing**

- User-facing errors and status messages are displayed in-page via `GenderifyApp.showStatus(message, isError)`.
  - `isError = true` → red-bordered box with class `status-message error`.
  - `isError = false` (default) → plain text with class `status-message info`.
- The `<p id="status-message" role="status">` element uses `role="status"` (implies `aria-live="polite"`), so screen readers announce changes without a page reload.
- Async Office operations in `replaceWordInDocument` are wrapped in `try/catch`. The caught error is routed to `showStatus`.
- `showStatus` and `clearStatus` are null-guarded; they do nothing if the DOM element has not been populated yet.
- The web tool uses `resetUI(message?)` to show a status message when there are no results.

**Recommended**

- Do not use `alert()`, `confirm()`, or `prompt()` anywhere in the project.
- Do not silently swallow errors. Every `catch` block must either call `showStatus` (Office Add-in), display a visible status (web tool), or re-throw.
- Add a `console.error` log in addition to `showStatus` for unexpected errors (Office API failures), so they appear in the browser DevTools console during development.

---

## Logging

**Existing**

Logging is minimal by design:

```typescript
console.log("Unsupported host application: " + host);
```

This is the only `console.*` call in the codebase.

**Recommended**

- Use `console.log` only for information that is meaningful during development and debugging.
- Use `console.error` for unexpected error conditions.
- Do not add verbose logging to core logic or UI update paths; it creates noise when inspecting the console during add-in development.
- Do not add a logging framework. The current level of logging is appropriate.

---

## Testing

**Existing**

- Framework: **Jest** with `jest-environment-jsdom`. Configuration in `jest.config.cjs`.
- All test files live in `src/__tests__/` and are named `*.test.ts`.
- TypeScript compilation for tests uses `tsconfig.jest.json` (CommonJS output, `noEmit: false`).

**Test isolation pattern (GenderifyApp tests)**

Each test creates a fresh `GenderifyApp` instance to avoid shared state:

```typescript
beforeEach(() => {
  jest.clearAllMocks();          // reset call counts; preserve mock implementations
  app = new GenderifyApp();
  document.body.innerHTML = `…`; // inject minimal DOM
  app.setupHtmlElements();       // wire DOM references to the new instance
});
```

**Mock strategy**

- `global.Office` is replaced by the hand-written mock in `src/__tests__/mocks.ts`.
- `genderDictionary.json` is replaced by a minimal two-entry mock via `jest.mock(…)`.
- `jest.spyOn` is used for verifying calls to Office API methods; prefer behavioral assertions (checking state changes) when call counting is not the primary concern.

**Core module tests (`textAnalyzer.test.ts`)**

`src/core/textAnalyzer.ts` has no Office or DOM dependencies; its tests need no mocks. Keep it that way.

**Recommended**

- Each test should have **one** primary assertion about observable behaviour or state. Avoid mega-tests.
- Do not export functions or state from production modules for the sole purpose of testing. The class pattern in `GenderifyApp` avoids this; maintain that discipline.
- When adding a new feature to `GenderifyApp`, add at least one test for the happy path and one for a relevant edge case.
- When adding logic to `src/core/`, write tests for it in `textAnalyzer.test.ts` first.
- `src/web/script.ts` is currently untested. If logic is added beyond DOM wiring, extract it to `src/core/` and test it there.

---

## Dependencies

**Existing**

- **Production `dependencies`**: only polyfills (`core-js`, `regenerator-runtime`). All other runtime behaviour is in the source code itself or provided by the browser/Office.js.
- **`devDependencies`**: build tools, type definitions, linting, testing.
- **`overrides`**: used only for security-fixing transitive dependencies. Each entry must correspond to a known CVE or Renovate security alert.

**Recommended**

- Before adding a new dependency, ask: can this be implemented in a few lines of code using existing language features or APIs? For a project of this size, the answer is often yes.
- Never add a package to `dependencies` that is only needed at build time. It would be unnecessarily downloaded when the package is installed as a library dependency (even though Genderify is not published to npm, this keeps intent clear).
- Do not add UI component libraries, state management libraries, routing libraries, or CSS preprocessors. The project intentionally avoids them.
- When a transitive dependency has a known vulnerability and the direct dependency has not yet released a fix, add the forced minimum version to `"overrides"` in `package.json` with a comment explaining why.

---

## Configuration

**Existing**

| Configuration                   | Location                                        | Mechanism                                                                   |
|---------------------------------|-------------------------------------------------|-----------------------------------------------------------------------------|
| Build entries, loaders, plugins | `webpack.config.js`                             | Constants at top of file; `env.target` parameter for manifest selection     |
| Production vs. development URLs | `webpack.config.js`                             | `urlDev` / `urlProd` constants; string replacement on manifest during build |
| TypeScript compiler             | `tsconfig.json`                                 | Main config; `tsconfig.jest.json` extends it for Jest                       |
| Prettier                        | `package.json` → `"prettier"`                   | Delegates to `office-addin-prettier-config`                                 |
| ESLint                          | `eslint-plugin-office-addins`                   | Managed by `office-addin-lint`                                              |
| Dev server port                 | `package.json` → `"config"` → `dev_server_port` | Read by Webpack via `process.env.npm_package_config_dev_server_port`        |

**Recommended**

- Do not use `.env` files. All build-time configuration is in `webpack.config.js`. Runtime configuration does not exist (no server).
- Do not hardcode URLs in TypeScript or JavaScript source files. URL constants belong in `webpack.config.js` where they can be substituted at build time.
- When adding a new configurable value (e.g., a new default for the gender character), prefer an HTML `value=""` attribute or a constant at the top of the relevant module, not a separate config file.

---

## Documentation

**Existing**

- **JSDoc** is present on all exported functions and public class methods in `src/core/` and `src/taskpane/genderify.ts`.
- JSDoc format: `/** … */` block, `@param name - description` (dash-separated), `@returns description`.
- Private class methods do not have JSDoc.
- Short inline comments are used for non-obvious behaviour (e.g., the null guard rationale in `showStatus`).
- Architecture and conventions are documented in `docs/`.

**Recommended**

- Write JSDoc for the **why** or **what**, not the **how**. If the code clearly shows what it does, skip the JSDoc.
- Keep JSDoc comments short. If a `@param` description is longer than one sentence, the function probably needs to be simplified.
- Do not document method signatures redundantly (e.g., avoid `@param text {string}` when the TypeScript signature already says `text: string`).
- Update `docs/architecture.md` when a structural change is made (new module, new entry point, change in data flow).
- Update this file (`docs/conventions.md`) when a new convention is established or an existing one changes.

---

## TypeScript Conventions

**Existing**

- `import { type X }` for type-only imports (enforced by the TypeScript compiler setting implicit in the config).
- `as unknown as T` is the accepted pattern when a direct cast is not possible (e.g., casting the JSON dictionary to `Record<string, Finding>`).
- Definite assignment assertion (`!`) is used on class fields populated after construction in `setupHtmlElements()`. This is acceptable because `setupHtmlElements()` is always called before the fields are accessed in normal flow.
- `Office.AsyncResult<any>` is used throughout because the Office.js types do not expose more specific result types for the used methods.
- TypeScript enums are used for DOM element IDs. String-based enums are preferred (values are plain strings, easier to debug).

**Recommended**

- Do not use `as any` or double-cast (`as unknown as any`) except where documented above.
- Avoid `non-null assertion operator` (`!`) outside of `setupHtmlElements()`. Prefer null guards with early returns.
- Use `interface` for object shapes (`Finding`). Use `type` only for union types or aliases that are not object shapes.
- The `strict` compiler option is not currently enabled. Do not introduce patterns that would break if `strict` were turned on in the future (e.g., implicit `any` parameters, uninitialized class fields without `!`).

---

## Office.js Conventions

**Existing**

- `Office.onReady(callback)` is used instead of the deprecated `Office.initialize`. ✓
- The host type is checked once in `GenderifyApp.initialize()` and stored in `_hostType`. All subsequent host-specific branching uses this stored value.
- Host-specific API calls are isolated in two private methods: `getSelectedData` and `setSelectedData`. No other method branches on host type.
- `Office.context.mailbox.item?.` is always accessed with optional chaining because `item` can be `null` in Outlook.
- `event.completed()` is called at the end of `action()` in `commands.ts`.

**Recommended**

- Do not call Office API methods outside of `GenderifyApp` or `commands.ts`. Core logic and web logic must remain free of Office API references.
- Wrap all Office callback-based APIs in a `new Promise` so callers can use `await`. Do not mix raw callbacks and `async/await` in the same function.
- When adding support for a new host, add a `case Office.HostType.Xyz:` to the `switch` in `initialize()` and add the corresponding host-specific branches to `getSelectedData` and `setSelectedData`.

---

## Things to Avoid

| Avoid                                         | Reason                                                                                                   |
|-----------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `alert()`, `confirm()`, `prompt()`            | Replaced by inline `showStatus()`. Modal dialogs interrupt add-in context and are inaccessible.          |
| Module-level `let` / `var` for mutable state  | State must live inside `GenderifyApp`. Module-level globals make tests unreliable.                       |
| Test-only exports in production modules       | Indicates that state is not properly encapsulated. Use the class pattern instead.                        |
| Hardcoded URLs in TypeScript / JavaScript     | URLs belong in `webpack.config.js` constants where they can be substituted at build time.                |
| `ts-loader` or `source-map-loader` in Webpack | The project uses `babel-loader` for Webpack builds. Do not add competing TS loaders.                     |
| A second Jest config file                     | `jest.config.cjs` is the active configuration. `jest.config.ts` exists only as a deprecated placeholder. |
| Fetching `genderDictionary.json` at runtime   | The dictionary is bundled statically. No HTTP dependency at runtime.                                     |
| UI frameworks (React, Vue, Svelte, etc.)      | The UI is intentionally minimal. A framework would add build complexity and bundle size for no gain.     |
| State management libraries                    | `GenderifyApp` private fields are sufficient.                                                            |
| CSS preprocessors (Sass, Less)                | Plain CSS is adequate for the current UI.                                                                |
| Publishing to npm                             | Genderify is an end-user tool, not a library.                                                            |
| Modifying `public/dist/` by hand              | This directory is Webpack build output. Any manual change will be overwritten on the next build.         |

