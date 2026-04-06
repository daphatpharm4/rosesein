# ROSE-SEIN Data Architecture

## Data Architecture Principle

ROSE-SEIN handles sensitive, health-adjacent, community, and operational data. The data architecture must default to private, minimal, and role-aware access patterns.

## Current Implemented Data Foundation

The current migration in [supabase/migrations/0001_initial_foundation.sql](/Users/charlesvictormahouve/Documents/rosesein/supabase/migrations/0001_initial_foundation.sql) defines the first production-oriented entities:

- `profiles`
- `user_roles`
- `articles`
- `events`
- `conversation_threads`
- `thread_participants`
- `messages`
- `notification_preferences`

It also defines:

- `profile_kind`
- `platform_role`
- `thread_kind`
- `set_updated_at()`
- `has_role()`
- RLS enablement and first-pass policies

## Current Entity Inventory

### `profiles`

Purpose:

- user identity surface
- patient or caregiver classification
- pseudonym support
- anonymous presentation mode

### `user_roles`

Purpose:

- authorization dimension
- staff and admin capability separation

### `articles`

Purpose:

- association-authored content
- validated editorial resources
- future actualités foundation

### `events`

Purpose:

- workshops
- support groups
- association events

### `conversation_threads`

Purpose:

- conversation container for association, direct, group, and mentorship threads

### `thread_participants`

Purpose:

- explicit access control for message visibility

### `messages`

Purpose:

- thread-level message history

### `notification_preferences`

Purpose:

- per-user notification configuration

## Missing Data Domains

The current schema does not yet cover all target product domains. The next schema phases should add:

- `community_spaces`
- `community_posts`
- `community_replies`
- `content_reports`
- `moderation_actions`
- `journey_entries`
- `appointments`
- `personal_notes`
- `wellbeing_entries`
- `documents`
- `document_access_logs`
- `volunteer_matches`
- `event_registrations`
- `audit_log`

## Data Classification

### Public data

- published association pages
- published articles
- published events without private attendee detail

### Internal but low sensitivity

- content draft metadata
- campaign and publishing schedules
- volunteer coordination metadata

### Sensitive personal data

- profiles
- notification preferences
- messages
- thread participation
- appointments
- notes
- wellbeing tracking
- uploaded documents

## Storage Model

### Postgres

Use Postgres for:

- profiles and roles
- content metadata
- threads and messages
- event metadata
- moderation and audit records
- preferences and journey metadata

### Supabase Storage

Use private buckets only for:

- prescriptions
- results
- journey documents
- potentially private media attachments

Never use public buckets for sensitive documents.

## RLS Posture

The current schema already enables RLS across the initial tables. The target posture remains:

- default deny
- explicit, minimal allow rules
- participant-scoped access for messages
- self-scope for personal preference and profile updates
- moderator and admin read expansion only where required

## Data Retention Direction

Recommended default retention expectations:

- operational logs: time-bounded but preserved for investigations
- moderation records: retained longer than public-facing content records
- messages: retained until product or legal policy defines deletion windows
- sensitive documents: retained only as long as the feature requires and clearly documented

The final retention matrix should be confirmed with legal and compliance review.

## Data Architecture Decisions

- Keep identity and authorization separate.
- Keep anonymous presentation separate from real traceability.
- Keep participant membership explicit for all private conversations.
- Introduce moderation and audit tables before scaling community features.
- Use append-friendly audit patterns for privileged actions.
