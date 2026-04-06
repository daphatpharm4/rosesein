# 09. Implementation Backlog

## Ticketing Rule

These tickets are written to be implementation-ready. Each ticket names scope, dependencies, and clear acceptance criteria.

## ROS-001: Profile bootstrap after auth ✅ DONE (2 April 2026)

- Goal: convert a signed-in session into a usable member profile
- Scope:
  - profile kind selection
  - display name
  - optional pseudonym
  - anonymous presentation preference
  - default member role row
  - default notification preference row
- Dependencies:
  - auth callback already live
  - RLS insert policies for profile bootstrap
- Acceptance criteria:
  - signed-in user without profile is redirected to profile setup
  - profile can be saved without service-role credentials
  - user can continue into protected routes after setup

## ROS-002: Live articles and events ✅ DONE (2 April 2026)

- Goal: replace static placeholders on `actualites`, `association`, and home cards with live published content
- Scope:
  - published articles query
  - published events query
  - empty states
  - website-app editorial ownership note
- Dependencies:
  - current article and event tables
- Acceptance criteria:
  - public pages render live published rows
  - drafts stay private
  - content owners can explain publish path

## ROS-003: Live association-first messaging ✅ DONE (2 April 2026)

- Goal: replace message mocks with participant-scoped Supabase reads
- Scope:
  - inbox loader
  - thread loader
  - send action
  - staff-provisioned official threads
- Dependencies:
  - ROS-001
  - thread and participant data seeding path
- Acceptance criteria:
  - users only see authorized threads
  - message sends succeed only for participants
  - mock data is removed from runtime path

## ROS-004: Moderation foundation ✅ DONE (3 April 2026)

- Goal: make reporting and moderation possible before any community expansion
- Scope:
  - report table
  - moderation action table
  - audit log
  - moderation workflow doc linked to app behavior
- Dependencies:
  - ROS-003 for message report targets
- Acceptance criteria:
  - a report can be created
  - moderator action is recorded with owner and timestamp
  - severe actions can be escalated

## ROS-005: Settings and notification preferences ✅ DONE (3 April 2026)

- Goal: turn `parametres` into a real profile and privacy control surface
- Scope:
  - profile read and update form
  - notification preference update
  - privacy explanation copy
- Dependencies:
  - ROS-001
- Acceptance criteria:
  - user can review and update their own settings
  - preferences persist in Supabase
  - privacy language is visible and plain

## ROS-006: Parcours foundation ✅ DONE (5 April 2026)

- Goal: make `parcours` useful without overreaching into document risk too early
- Scope:
  - appointments
  - personal notes
  - no file uploads in this ticket
- Dependencies:
  - ROS-001
- Acceptance criteria:
  - appointments and notes are private and user-scoped
  - no public or cross-user access is possible

## ROS-007: Help and support surface ✅ DONE (5 April 2026)

- Goal: provide a clear non-clinical orientation and escalation path
- Scope:
  - help page
  - support contacts
  - FAQ blocks
  - non-emergency disclaimer
- Dependencies:
  - service delivery scripts from workflow docs
- Acceptance criteria:
  - users can find support and emergency orientation quickly
  - medical authority is not overstated

## Recommended Build Order

1. ROS-001
2. ROS-002
3. ROS-003
4. ROS-005
5. ROS-004
6. ROS-006
7. ROS-007
