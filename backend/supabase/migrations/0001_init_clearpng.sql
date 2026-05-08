create extension if not exists "pgcrypto";

create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  original_file_path text not null,
  processed_file_path text not null,
  original_file_name text not null,
  mime_type text not null,
  status text not null default 'completed',
  settings jsonb not null default '{}'::jsonb,
  share_token text not null unique,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

alter table public.conversions enable row level security;

create policy "Anyone can create conversions"
on public.conversions
for insert
to anon
with check (expires_at <= now() + interval '24 hours 5 minutes');

create or replace function public.get_shared_conversion(token text)
returns table (
  original_file_name text,
  processed_file_path text,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.original_file_name,
    c.processed_file_path,
    c.expires_at
  from public.conversions c
  where c.share_token = token
    and c.expires_at > now()
  limit 1;
$$;

revoke all on function public.get_shared_conversion(text) from public;
grant execute on function public.get_shared_conversion(text) to anon;

insert into storage.buckets (id, name, public)
values
  ('original-images', 'original-images', false),
  ('processed-images', 'processed-images', false)
on conflict (id) do update set public = excluded.public;
