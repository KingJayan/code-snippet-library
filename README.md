# code snippet library

minimal, fast personal snippet vault built with next.js, supabase, shadcn ui, and shiki.

## stack

- next.js app router + typescript
- tailwind css + shadcn ui
- supabase (postgres + auth)
- shiki for syntax highlighting

## setup

1. install deps

```bash
npm install
```

2. create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

3. run sql schema in supabase sql editor

- file: `supabase/schema.sql`

4. start dev server

```bash
npm run dev
```

## keyboard shortcuts

- `n` on list page: open new snippet dialog
- `cmd/ctrl + enter` in dialog: save snippet
- `e` on detail page: edit snippet
- `c` on detail page: copy snippet code

## performance notes

- virtualized snippet list rendering
- abort-safe snippet fetches
- background revalidation with session cache
- shiki highlight cache for repeat code views

## scripts

```bash
npm run lint
npx tsc --noEmit
```
