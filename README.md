# code snippet library

minimal, fast personal snippet vault built with next.js, supabase, shadcn ui, and shiki.

## features

- pin important snippets to top of list
- make snippets public and share with anyone
- switch code themes (github-dark, github-light, dracula, nord, monokai, one-dark-pro)
- tag-based filtering with search (duplicate tags auto-removed, 30 char max)
- magic link authentication with session expiry handling
- keyboard shortcuts for quick actions
- virtualized list for performance
- loading skeletons for smoother ux

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
- **important**: refresh api schema cache in supabase project settings → api

**existing database?** if you already have the snippets table, run this migration:

```sql
alter table public.snippets add column pinned boolean not null default false;
alter table public.snippets add column public boolean not null default false;
create index snippets_user_pinned_idx on public.snippets(user_id, pinned desc, updated_at desc);
create index snippets_public_idx on public.snippets(public, created_at desc) where public = true;

create policy "anyone can view public snippets"
  on public.snippets for select
  using (public = true);
```

4. start dev server

```bash
npm run dev
```

## keyboard shortcuts

- `n` on list page: open new snippet dialog
- `cmd/ctrl + enter` in dialog: save snippet
- `e` on detail page: edit snippet
- `c` on detail page: copy snippet code

## usage

**pinning**
- click pin icon on snippet cards or detail page
- pinned snippets appear at top of list

**sharing**
- click share button on detail page to copy url
- toggle public/private to create shareable links
- public snippets accessible at `/public/[id]` without auth
- share copies public url when snippet is public

**themes**
- click palette icon on code blocks to switch syntax themes
- theme preference persists in browser

**tags**
- comma-separated input in snippet dialog
- duplicates auto-removed, normalized to lowercase
- 30 character max per tag
- tags truncated in ui with hover tooltip

## performance notes

- virtualized snippet list rendering
- abort-safe snippet fetches with request tracking
- background revalidation with session cache
- shiki highlight cache for repeat code views
- theme preference stored locally
- pinned snippets prioritized in sorting
- session expiry detection with helpful errors
- loading skeletons for auth panel and snippets list

## scripts

```bash
npm run lint
npx tsc --noEmit
```
