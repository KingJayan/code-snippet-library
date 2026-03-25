-- code snippet library - database schema
-- run this in the supabase sql editor to bootstrap the project

-- enable uuid generation
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────
-- workspaces
-- ────────────────────────────────────────────
create table public.workspaces (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(owner_id, name)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner', 'editor', 'viewer')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on public.workspace_members(user_id);

-- ────────────────────────────────────────────
-- snippets
-- ────────────────────────────────────────────
create table public.snippets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title       text not null,
  language    text not null default 'plaintext',
  description text default '',
  code        text not null,
  pinned      boolean not null default false,
  public      boolean not null default false,
  benchmark_chars integer,
  benchmark_bytes integer,
  benchmark_bits integer,
  benchmark_lines integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- index for full-text search on title + description
create index snippets_search_idx on public.snippets
  using gin (to_tsvector('english', title || ' ' || coalesce(description, '')));

-- index for user lookups + pinned sorting
create index snippets_user_id_idx on public.snippets(user_id);
create index snippets_workspace_id_idx on public.snippets(workspace_id);
create index snippets_user_pinned_idx on public.snippets(user_id, pinned desc, updated_at desc);
create index snippets_public_idx on public.snippets(public, created_at desc) where public = true;

-- auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger snippets_updated_at
  before update on public.snippets
  for each row execute function public.handle_updated_at();

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.handle_updated_at();

-- ────────────────────────────────────────────
-- tags
-- ────────────────────────────────────────────
create table public.tags (
  id   uuid primary key default uuid_generate_v4(),
  name text not null unique
);

create index tags_name_idx on public.tags(name);

-- ────────────────────────────────────────────
-- snippet ↔ tag (many-to-many)
-- ────────────────────────────────────────────
create table public.snippet_tags (
  snippet_id uuid not null references public.snippets(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  primary key (snippet_id, tag_id)
);

create index snippet_tags_snippet_idx on public.snippet_tags(snippet_id);
create index snippet_tags_tag_idx on public.snippet_tags(tag_id);

-- ────────────────────────────────────────────
-- row level security
-- ────────────────────────────────────────────

-- snippets: users can only crud their own rows, but anyone can view public snippets
alter table public.snippets enable row level security;

-- workspaces
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "users can view own or shared workspaces"
  on public.workspaces for select
  using (
    owner_id = auth.uid()
    or is_public = true
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

create policy "users can create own workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

create policy "owners can update workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners can delete workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

create policy "users can view own workspace memberships"
  on public.workspace_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  );

create policy "owners can manage workspace memberships"
  on public.workspace_members for all
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  );

create policy "users can view own snippets"
  on public.snippets for select
  using (auth.uid() = user_id);

create policy "users can view workspace snippets"
  on public.snippets for select
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = snippets.workspace_id
        and (
          w.owner_id = auth.uid()
          or w.is_public = true
          or exists (
            select 1 from public.workspace_members wm
            where wm.workspace_id = snippets.workspace_id
              and wm.user_id = auth.uid()
          )
        )
    )
  );

create policy "anyone can view public snippets"
  on public.snippets for select
  using (public = true);

create policy "users can insert own snippets"
  on public.snippets for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workspaces w
      where w.id = snippets.workspace_id
        and (
          w.owner_id = auth.uid()
          or exists (
            select 1 from public.workspace_members wm
            where wm.workspace_id = snippets.workspace_id
              and wm.user_id = auth.uid()
              and wm.role in ('owner', 'editor')
          )
        )
    )
  );

create policy "users can update own snippets"
  on public.snippets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own snippets"
  on public.snippets for delete
  using (auth.uid() = user_id);

-- tags: readable by all authenticated users, writable by all authenticated
alter table public.tags enable row level security;

create policy "authenticated users can view tags"
  on public.tags for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can insert tags"
  on public.tags for insert
  with check (auth.role() = 'authenticated');

-- snippet_tags: follows snippet ownership
alter table public.snippet_tags enable row level security;

create policy "users can view own snippet_tags"
  on public.snippet_tags for select
  using (
    exists (
      select 1 from public.snippets
      where snippets.id = snippet_tags.snippet_id
        and snippets.user_id = auth.uid()
    )
  );

create policy "users can insert own snippet_tags"
  on public.snippet_tags for insert
  with check (
    exists (
      select 1 from public.snippets
      where snippets.id = snippet_tags.snippet_id
        and snippets.user_id = auth.uid()
    )
  );

create policy "users can delete own snippet_tags"
  on public.snippet_tags for delete
  using (
    exists (
      select 1 from public.snippets
      where snippets.id = snippet_tags.snippet_id
        and snippets.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────
-- migration: add pinned + public columns to existing db
-- ────────────────────────────────────────────
-- run this if you already have a snippets table:
--
-- create table public.workspaces (
--   id uuid primary key default uuid_generate_v4(),
--   owner_id uuid not null references auth.users(id) on delete cascade,
--   name text not null,
--   is_public boolean not null default false,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now(),
--   unique(owner_id, name)
-- );
--
-- create table public.workspace_members (
--   workspace_id uuid not null references public.workspaces(id) on delete cascade,
--   user_id uuid not null references auth.users(id) on delete cascade,
--   role text not null check (role in ('owner', 'editor', 'viewer')),
--   created_at timestamptz not null default now(),
--   primary key (workspace_id, user_id)
-- );
--
-- alter table public.snippets add column if not exists workspace_id uuid references public.workspaces(id);
-- alter table public.snippets add column if not exists pinned boolean not null default false;
-- alter table public.snippets add column if not exists public boolean not null default false;
-- alter table public.snippets add column if not exists benchmark_chars integer;
-- alter table public.snippets add column if not exists benchmark_bytes integer;
-- alter table public.snippets add column if not exists benchmark_bits integer;
-- alter table public.snippets add column if not exists benchmark_lines integer;
--
-- insert into public.workspaces (owner_id, name)
-- select distinct user_id, 'default' from public.snippets
-- on conflict (owner_id, name) do nothing;
--
-- update public.snippets s
-- set workspace_id = w.id
-- from public.workspaces w
-- where w.owner_id = s.user_id and w.name = 'default' and s.workspace_id is null;
--
-- do $$
-- begin
--   if exists (
--     select 1
--     from information_schema.columns
--     where table_schema = 'public'
--       and table_name = 'snippets'
--       and column_name = 'workspace_id'
--       and is_nullable = 'YES'
--   ) then
--     alter table public.snippets alter column workspace_id set not null;
--   end if;
-- end
-- $$;
-- create index if not exists snippets_user_pinned_idx on public.snippets(user_id, pinned desc, updated_at desc);
-- create index if not exists snippets_public_idx on public.snippets(public, created_at desc) where public = true;
--
-- do $$
-- begin
--   if not exists (
--     select 1
--     from pg_policies
--     where schemaname = 'public'
--       and tablename = 'snippets'
--       and policyname = 'anyone can view public snippets'
--   ) then
--     create policy "anyone can view public snippets"
--       on public.snippets for select
--       using (public = true);
--   end if;
-- end
-- $$;
