# code snippet library

minimal, fast personal (and shared) snippet vault built with next.js, supabase, shadcn ui, and shiki.

## features

- pin important snippets to top of list
- make snippets public and share with anyone (with public browse page)
- switch code themes (github-dark, github-light, dracula, nord, monokai, one-dark-pro)
- tag-based filtering with search (duplicate tags auto-removed, 30 char max)
- magic link authentication with session expiry handling
- production-safe magic link redirect resolution (supports deployed app url)
- keyboard shortcuts for quick actions (n, ?, esc)
- snippet code preview on hover (first line in tooltip)
- virtualized list for performance
- loading skeletons for smoother ux
- public snippets discovery page at `/public`
- mobile-friendly floating action button
- ai coding assistant sidebar on snippet detail pages (hidden in public view)
- multi-provider ai support with mode-aware prompts (`improve`, `refactor`, `debug`, `explain`)
- optional ai similarity search (default off), ai auto-tagging, and ai docs generation
- unified settings with a11y controls

## stack

- next.js app router + typescript
- tailwind css + shadcn ui
- supabase (postgres + auth)
- shiki for syntax highlighting
- modular ai provider adapters (openai, anthropic, gemini, ollama, openrouter, openai-compatible, puter)

## ui preview

### 1) snippets dashboard (dark)
Primary workspace surface with quick actions, search/filter area, and snippet list cards.

![Snippets dashboard](docs/screenshots/snippets-dashboard.png)

### 2) workspace explorer (light)
Explorer-style folder/workspace manager with size states and pinned snippet previews.

![Workspace explorer](docs/screenshots/workspace-explorer-light.png)

### 3) ai edits panel
Context-aware AI assistant sidebar with provider/model/mode controls and chat history.

![AI edits panel](docs/screenshots/ai-edits-panel.png)

## setup

1. install deps

```bash
npm install
```

2. create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

optional ai env vars (you can also provide keys in the ui):

```env
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

3. run sql schema in supabase sql editor

- file: `supabase/schema.sql`
- **important**: refresh api schema cache in supabase project settings → api
<!--
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
-->

4. start dev server

```bash
npm run dev
```

## keyboard shortcuts

- `n` on list page: open new snippet dialog
- `?` on list page: show all shortcuts overlay
- `esc`: close dialog, clear search, clear tag filter, or close shortcuts overlay
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

**public snippets**
- discover and explore public snippets from other users
- search by title, language, or tags
- filter by tags for discovery
- credit to snippet creators in footer
- no ai sidebar/chat is shown in public snippet view

**ai assistant**
- open the ai panel on snippet detail page
- choose provider, model, and mode (`improve`, `refactor`, `debug`, `explain`)
- ask for changes, then apply suggested code directly into the editor
- generate tags and docs from snippet content in the snippet dialog
- enable similarity search from settings to find related snippets by intent

**settings**
- open settings from the header action
- switch between `ai`, `prefs`, and `a11y` in the mini vertical nav
- preferences include compact layout, hint visibility, code wrapping, and default code theme

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
- local preferences
- efficient filtering

## scripts

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## deploy

- includes `vercel.json` and `.vercelignore` for vercel deployment
- make sure supabase auth url config includes your production domain/callbacks

### made with :) by jayan