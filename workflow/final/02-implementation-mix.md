# 02. Implementation Mix

| Capability | Build in app | Reuse public website | Supabase native capability | Manual operations | Future integration |
| --- | --- | --- | --- | --- | --- |
| Accueil | yes | selected links | no | editorial curation | later personalization |
| Compte | yes | no | Auth | support fallback for account issues | possible SMS later |
| Actualités | yes for curated feed | yes for broader archive | Postgres | editorial publishing review | possible shared CMS later |
| Events | yes | yes for public awareness pages | Postgres | association event coordination | calendar export later |
| Chat | yes | no | Postgres, Auth, RLS | staff thread provisioning at MVP | realtime later if needed |
| Parcours | yes | no | Postgres, Storage later | none | secure file workflows later |
| Association | partial | yes, primary source at first | Postgres for announcements later | admin-managed website updates | donor tooling later |
| Notifications | yes, limited | no | Postgres preferences | manual announcement fallback | email/SMS provider later |
| Aide | yes, simple | yes for public contact info | no | support scripts | helpdesk tooling later |
| Moderation | yes, minimal | no | Postgres, Auth, RLS | heavy human review at MVP | advanced trust signals later |

## Recommendation

For MVP, use build plus manual operations. Do not wait for a perfect integrated stack before launching the association-managed core.
