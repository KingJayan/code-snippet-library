# contributions

thanks for helping build this project

## credits

- created and maintained by jayan
- no open source contributers yet

## ways to contribute

- report bugs, ideas, or ux feedback by opening [an issue](https://github.com/KingJayan/code-snippet-library/issues/new/choose)
- submit fixes and features by [creating a pr](https://github.com/KingJayan/code-snippet-library/compare)

## quick start

1. fork the repo
2. create a branch from main
3. make focused changes
4. run checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

5. open your pull request with a short test note

## notes about pr format

- keep the pr scoped to one issue or one feature
- use a clear title like `feat: add inline edit mode` or `fix: improve credits links`
- include a short summary with:
	- what changed
	- why it changed
	- how you tested it
- include screenshots or a short recording for visible ui changes
- link the related issue when possible
- avoid mixing unrelated refactors with the main change

## notes about code

- use typescript and match existing patterns in the codebase
- keep changes minimal, concise, and maintainable
- prefer reuse of existing ui primitives/components before adding new ones
- keep comments minimal and only where logic is not obvious
- avoid one-letter variable names unless they are standard loop counters
- keep user-facing copy readable and consistent
- test on desktop and mobile if ui behavior changed

## before opening a pr

run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## pr checklist

- [ ] change is scoped to the issue/feature
- [ ] no unrelated refactors
- [ ] typecheck/build pass locally
- [ ] ui works on desktop and mobile (if applicable)
- [ ] screenshots/gif included for visible ui changes

## reporting issues

please include:

- steps to reproduce
- expected vs actual behavior
- browser/os, hardware(if applicable)
- console errors and screenshots

