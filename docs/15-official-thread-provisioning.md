# 15. Official Thread Provisioning

## Purpose

`ROS-003` introduces live participant-scoped messaging. Official association threads are intentionally provisioned by staff, not by arbitrary end users.

## Current Guardrails

- Users can read only threads they participate in.
- Users can send messages only inside threads they participate in.
- Public runtime paths no longer rely on mocked inbox data.
- Inserts into `conversation_threads` and `thread_participants` are staff-only at the RLS layer.

## Staff Provisioning Model

For now, official threads are provisioned through Supabase SQL or an internal admin workflow built later.

Typical flow:

1. Create the official thread in `conversation_threads`.
2. Add the intended members in `thread_participants`.
3. Optionally post the first official message in `messages`.

## Example SQL

```sql
insert into public.conversation_threads (kind, title, created_by, is_official)
values ('association', 'Association ROSE-SEIN', auth.uid(), true)
returning id;
```

Then add participants:

```sql
insert into public.thread_participants (thread_id, user_id)
values
  ('<thread_uuid>', '<member_uuid_1>'),
  ('<thread_uuid>', '<member_uuid_2>');
```

Optional first message:

```sql
insert into public.messages (thread_id, sender_id, body)
values ('<thread_uuid>', auth.uid(), 'Bienvenue dans votre fil officiel ROSE-SEIN.');
```

## Local Testing Note

There is no generic SQL seed for private messaging because it depends on real authenticated user IDs. Seed the public content with:

- [seed-public-content.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/seed-public-content.sql)

Then create test users through Supabase Auth and provision a thread with those concrete UUIDs.
