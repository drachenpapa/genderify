# Contribution Guidelines

First off, thank you for considering contributing to this project.
It's people like you that make this project and open source in general so great.

Following these guidelines helps to communicate that you respect the time of the developers
managing and developing this open source project. 
In return, they should reciprocate that respect in addressing your issue, assessing changes,
and helping you finalize your pull requests.

- [Code of Conduct](#code-of-conduct)
- [Issues and Bugs](#issues-and-bugs)
- [Feature Requests](#feature-requests)
- [Submission Guidelines](#submission-guidelines)
- [Coding Rules](#coding-rules)
- [Commit Message Guidelines](#commit-message-guidelines)

## <a name="code-of-conduct"></a> Code of Conduct

This project adheres to a strict [Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.
Please report any unacceptable behavior to [@drachenpapa](https://github.com/drachenpapa).

## <a name="issues-and-bugs"></a> Found a Bug?

If you find a bug in the source code, you can help us by [submitting an issue](#submit-issue)
to our [GitHub Repository](https://github.com/drachenpapa/skeletor/issues).
Even better, you can [submit a Pull Request](#submit-pr) with a fix.

## <a name="feature-requests"></a> Missing a Feature?

If you have an idea for a new feature, we'd love to hear it!
Please [submit an issue](https://github.com/drachenpapa/skeletor/issues/new/choose) with details
about the feature and how it would benefit the project.

## <a name="submission-guidelines"></a> Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue

Before you submit an issue, please search the issue tracker.
An issue for your problem might already exist, and the discussion might inform you of workarounds readily available.

We want to fix all the issues as soon as possible, but before fixing a bug, we need to reproduce and confirm it.
In order to reproduce bugs, we require that you provide a minimal reproduction.
Having a minimal reproducible scenario gives us a wealth of important information 
without going back and forth with additional questions.

A minimal reproduction allows us to quickly confirm a bug (or point out a coding problem)
as well as confirm that we are fixing the right problem.

Unfortunately, we are not able to investigate or fix bugs without a minimal reproduction,
so if we don't hear back from you, we are going to close an issue that doesn't have enough info to be reproduced.

You can file new issues by selecting from our [new issue templates](https://github.com/drachenpapa/skeletor/issues/new/choose)
and filling out the issue template.

### <a name="submit-pr"></a> Submitting a Pull Request (PR)

1. Fork the repository.
2. Create your feature branch: `git checkout -b my-new-feature`.
3. Commit your changes: `git commit -m 'feat: add some feature'`.
4. Push to the branch: `git push origin my-new-feature`.
5. Submit a pull request.

## <a name="coding-rules"></a> Coding Rules

- All code must adhere to the project's coding standards and guidelines.
- Ensure all tests pass and add new tests for your code if necessary.
- Write clear and concise commit messages.

## <a name="commit-message-guidelines"></a> Commit Message Guidelines

A good commit message serves at least three important purposes:
- To speed up the reviewing process.
- To help us write a good release note.
- To help the future maintainers of Skeletor (it could be you!), say five years into the future,
   to find out why a particular change was made to the code or why a specific feature was added.

Each commit message consists of a **header** and a **body**.
``` 
<header>
<BLANK LINE>
<body>
```

The header is mandatory and the body and footer are optional.

### <a name="commit-header"></a> Commit Message Header

For the commit message header, we loosely follow the semantic commit message format.
```
<type>: <short summary>
  │             │
  │             └─⫸ Summary in a few words.
  │
  └─⫸ Commit Type: build|chore|ci|docs|feat|fix|refactor|revert|test
```

Both the `<type>` and `<summary>` fields are mandatory.

#### Type

Must be one of the following:
* **build**: Changes that affect the build system or external dependencies.
* **chore**: Other changes that don't modify src or test files, updating grunt tasks etc; no production code change.
* **ci**: Changes to our CI configuration files and scripts (example: GitHub actions).
* **docs**: Changes to our documentation.
* **feat**: A new feature for the user, not a new feature for build scripts.
* **fix**: A bug fix for the user, not a fix to a build script.
* **refactor**: A code change that neither fixes a bug nor adds a feature, eg. renaming a variable, format changes, or performance improvements.
* **revert**: Reverts a previous commit.
* **test**: Adding missing tests or refactoring existing tests; no production code change.

#### Summary

Use the summary field to provide a succinct description of the change:
* Use the imperative, present tense: "change" not "changed" nor "changes".
* Don't capitalize the first letter.
* No dot (.) at the end.

### <a name="commit-body"></a> Commit Message Body

The body must be used to inform about breaking changes or deprecations and is also the place to reference GitHub issues that this commit closes or is related to.

For example:
```
BREAKING CHANGE: <breaking change summary>
<BLANK LINE>
<breaking change description + migration path>
<BLANK LINE>
<BLANK LINE>
Fixes #<issue number>
```

or

```
DEPRECATED: <deprecation summary>
<BLANK LINE>
<deprecation description + recommended update path>
<BLANK LINE>
<BLANK LINE>
Closes #<issue number>
```

Breaking Change section should start with the phrase `BREAKING CHANGE:` followed by a summary of the breaking change, a blank line, and a detailed description of the breaking change that also includes migration instructions.

Similarly, a Deprecation section should start with `DEPRECATED:` followed by a short description of what is deprecated, a blank line, and a detailed description of the deprecation that also mentions the recommended update path.

### Revert commits

If the commit reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit.

The content of the commit message body should contain:
- Information about the SHA of the commit being reverted in the following format: `This reverts commit <SHA>`.
- A clear description of the reason for reverting the commit message.


## Thank You!
Thanks again for your contribution, you're awesome! :heart:
