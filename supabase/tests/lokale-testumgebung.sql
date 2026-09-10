-- Nachbildung der Supabase-Umgebung fuer den lokalen Test der Migration.
create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (id uuid primary key, email text);
-- auth.uid() liefert in Supabase die eingeloggte Person; hier steuerbar
-- ueber eine Sitzungsvariable.
create function auth.uid() returns uuid
language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;

create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid
);
alter table storage.objects enable row level security;
-- Wie in Supabase: alle Pfadteile vor dem Dateinamen
create function storage.foldername(name text) returns text[]
language sql immutable as $$
  select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1] $$;

create publication supabase_realtime;

-- Supabase vergibt Rechte auf neue Tabellen automatisch; hier ebenso.
grant usage on schema public, auth, storage to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
grant all on storage.objects, storage.buckets to authenticated;
grant execute on function auth.uid() to anon, authenticated;
