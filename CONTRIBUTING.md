# Contributing

Thanks for helping improve this project.

## Development setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with required vars:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Start dev server:

```bash
npm run dev
```

## Branching and commits

- Create a feature/fix branch from `main`.
- Keep commits focused and small.
- Use clear commit messages, e.g.:
  - `feat: add workspace side nav`
  - `fix: prevent abort toast on route change`

## Code style

- Use TypeScript.
- Follow existing component and naming patterns.
- Prefer minimal, targeted changes over large refactors.
- Reuse existing UI primitives and theme tokens.

## Before opening a PR

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

If you changed behavior, include a short note in PR description with:

- What changed
- Why it changed
- How you tested it

## PR checklist

- [ ] Change is scoped to the issue/feature
- [ ] No unrelated refactors
- [ ] Typecheck/build pass locally
- [ ] UI works on desktop and mobile (if applicable)
- [ ] Screenshots/GIF for visible UI changes

## Reporting issues

Please include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS
- Console errors and screenshots
