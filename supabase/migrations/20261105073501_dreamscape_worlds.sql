create schema if not exists dreamscape_private;
revoke all on schema dreamscape_private from public;
grant usage on schema dreamscape_private to authenticated;

create table public.worlds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  scene jsonb not null check (
    jsonb_typeof(scene) = 'object' and scene @> '{"schemaVersion":1}'
    and coalesce(jsonb_typeof(scene->'objects') = 'array', false)
    and octet_length(scene::text) <= 2000000
  ),
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
create index worlds_owner_updated_idx on public.worlds (owner_id, updated_at desc);

create table public.world_versions (
  world_id uuid not null references public.worlds(id) on delete cascade,
  revision integer not null,
  name text not null,
  scene jsonb not null,
  created_at timestamptz not null default now(),
  primary key (world_id, revision)
);

create table public.exploration_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  world_id uuid not null,
  revision integer not null,
  expires_at timestamptz not null default now() + interval '2 hours',
  foreign key (world_id, revision) references public.world_versions on delete cascade
);
create index exploration_rooms_snapshot_idx on public.exploration_rooms (world_id, revision);
create index exploration_rooms_owner_idx on public.exploration_rooms (owner_id);
create table public.exploration_guests (
  room_id uuid primary key references public.exploration_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade
);
create index exploration_guests_user_idx on public.exploration_guests (user_id);

alter table public.worlds enable row level security;
alter table public.world_versions enable row level security;
alter table public.exploration_rooms enable row level security;
alter table public.exploration_guests enable row level security;
revoke all on public.worlds, public.world_versions, public.exploration_rooms, public.exploration_guests from public, anon, authenticated;
grant select on public.worlds, public.world_versions, public.exploration_rooms, public.exploration_guests to authenticated;
grant insert(name, scene), update(name, scene) on public.worlds to authenticated;
grant insert(world_id, revision), update(expires_at) on public.exploration_rooms to authenticated;

create policy world_read on public.worlds for select to authenticated using (owner_id = (select auth.uid()));
create policy world_create on public.worlds for insert to authenticated with check (owner_id = (select auth.uid()));
create policy world_update on public.worlds for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy guest_read on public.exploration_guests for select to authenticated using (user_id = (select auth.uid()));
create policy room_read on public.exploration_rooms for select to authenticated using (
  owner_id = (select auth.uid()) or
  (expires_at > now() and exists (select 1 from public.exploration_guests g where g.room_id = id))
);
create policy room_create on public.exploration_rooms for insert to authenticated with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.worlds w where w.id = world_id)
);
create policy room_close on public.exploration_rooms for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and expires_at <= now());
create policy version_read on public.world_versions for select to authenticated using (
  exists (select 1 from public.worlds w where w.id = world_id)
  or exists (select 1 from public.exploration_rooms r
    where r.world_id = world_versions.world_id and r.revision = world_versions.revision and r.expires_at > now())
);

create function dreamscape_private.advance_world_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
create trigger advance_world_revision before update on public.worlds
for each row execute function dreamscape_private.advance_world_revision();

create function dreamscape_private.snapshot_world() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.world_versions (world_id, revision, name, scene)
  values (new.id, new.revision, new.name, new.scene);
  return new;
end;
$$;
revoke all on function dreamscape_private.snapshot_world() from public;
create trigger snapshot_world after insert or update on public.worlds
for each row execute function dreamscape_private.snapshot_world();

create function dreamscape_private.join_room(room_code uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  room public.exploration_rooms%rowtype;
  visitor uuid := auth.uid();
begin
  if visitor is null then raise exception 'Sign in to join a room'; end if;
  select * into room from public.exploration_rooms where id = room_code for update;
  if not found or room.expires_at <= now() then raise exception 'This invitation has expired or is invalid'; end if;
  if room.owner_id = visitor then return 0; end if;
  insert into public.exploration_guests (room_id, user_id) values (room_code, visitor)
  on conflict (room_id) do nothing;
  if not exists (select 1 from public.exploration_guests where room_id = room_code and user_id = visitor)
    then raise exception 'This room already has a guest'; end if;
  return 1;
end;
$$;
revoke all on function dreamscape_private.join_room(uuid) from public;
grant execute on function dreamscape_private.join_room(uuid) to authenticated;
create function public.join_exploration_room(room_code uuid) returns integer
language sql security invoker set search_path = '' as $$
  select dreamscape_private.join_room(room_code);
$$;
revoke all on function public.join_exploration_room(uuid) from public, anon;
grant execute on function public.join_exploration_room(uuid) to authenticated;

create policy dreamscape_room_receive on realtime.messages for select to authenticated using (
  extension in ('broadcast', 'presence') and exists (
    select 1 from public.exploration_rooms r
    where (select realtime.topic()) = 'explore:' || r.id::text and r.expires_at > now()
  )
);
create policy dreamscape_room_send on realtime.messages for insert to authenticated with check (
  extension in ('broadcast', 'presence') and exists (
    select 1 from public.exploration_rooms r
    where (select realtime.topic()) = 'explore:' || r.id::text and r.expires_at > now()
  )
);
