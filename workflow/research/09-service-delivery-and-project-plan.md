# 09. Service Delivery and Project Plan

## Delivery Objective

Launch a credible MVP that the association can actually operate, support, and explain.

## Workstream Owners

| Workstream | Primary owner | Supporting owners |
| --- | --- | --- |
| Product and UX | product lead | UI/UX, association lead |
| Platform and auth | technical lead | backend, frontend |
| Content and events | editorial owner | association admin |
| Messaging and moderation | service delivery owner | moderator lead, security lead |
| Privacy and compliance | privacy owner | technical lead, admin owner |
| Sponsorship and reporting | association leadership | marketing and operations |

## Governance Cadence

- weekly product and delivery standup
- weekly content and moderation check-in
- release review before each production push
- monthly leadership review of adoption, support load, and risks

## Core Operating Expectations

- every published content type has an owner
- every user-generated surface has a moderation owner
- every release has a rollback owner
- every privacy-sensitive change has a review owner

## RAID Snapshot

| Type | Item | Impact | Owner | Mitigation |
| --- | --- | --- | --- | --- |
| Risk | messaging is still mock-backed | users may assume feature is ready | technical lead | wire live data before promotion |
| Risk | no profile bootstrap after auth | broken authenticated experience | backend owner | add onboarding step immediately |
| Assumption | website remains public trust layer | content strategy depends on it | product owner | keep coexistence model explicit |
| Issue | moderation workflow not implemented | unsafe expansion into community | service delivery owner | defer community launch |
| Dependency | article and event publishing model | affects actualités quality | editorial owner | define publishing workflow before live rollout |

## Six-Week Delivery Framing

### Weeks 1-2

- finish auth and profile bootstrap
- define content ownership and initial event workflow
- set release and moderation owners

### Weeks 3-4

- wire live articles, events, and participant-scoped messaging
- add reporting foundation and moderation process
- validate service responses and escalation scripts

### Weeks 5-6

- tighten settings and notification preferences
- complete pilot analytics and support dashboards
- rehearse launch, rollback, and support playbooks

## Launch Readiness Gates

1. signed-in users can complete profile bootstrap
2. only authorized users can access message data
3. content publishing owner is active
4. support and moderation scripts exist
5. production release and rollback checklist is assigned

## Recommendation

The project should be run as a service launch, not just as a code launch. Software completion without operational ownership will not hold in production.
