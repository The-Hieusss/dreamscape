-- Existing foreign keys cascade from worlds to versions, rooms, and guests.
grant delete on public.worlds to authenticated;

create policy world_delete on public.worlds
for delete to authenticated
using (owner_id = (select auth.uid()));
