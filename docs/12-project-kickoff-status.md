# Project Kickoff — Status & Next Steps

**Date**: 2 April 2026
**Participants**: Association Rose Sein, Charles Mahouve, Charlie Arnaud
**Document type**: Team handoff — what has been done, what comes next

---

## Context

This document follows the kickoff meeting for the ROSE-SEIN mobile app project. It captures the current state of the project, decisions made during the meeting, and the concrete next steps assigned to each party.

The goal of this meeting was to align on the scope and positioning of the app, review what already exists, and define the path to a structured first iteration.

---

## What Was Discussed

### Scope & Positioning
- The app targets cancer patients and their support network (caregivers, volunteers, peers).
- Three core functional areas were identified:
  1. **Anonymous community features** — peer support, shared experiences, moderated forums
  2. **Support content** — trusted information, resources, and editorial content aligned with rosesein.org
  3. **Specialist directory / booking** — a potential layer connecting users to oncologists, psychologists, and other relevant professionals (feasibility TBD)

### Key Open Questions at Time of Meeting
- Which features are must-have for v1 vs. later iterations?
- What is technically feasible for the specialist booking/agenda feature in a first version?
- How does the app connect to or complement the existing website?
- What operational constraints (moderation, legal, data privacy) need to be factored in early?

---

## What Has Been Completed

### By Association Rose Sein
- Sent the full list of desired app features (communities, support content, specialist booking, and other must-haves)
- Shared current website access details and relevant links/credentials/hosting information
- Provided existing notes on the app concept for the team to use when structuring screens and user journeys
- Confirmed availability for weekly follow-up meetings (Thursdays or Fridays daytime, or weekday evenings after 19:30)

### By the Technical Team
- Initial project architecture documented (`docs/00` through `docs/11`)
- Technical stack selected and partially implemented: Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase
- Design system defined: color palette, typography (Plus Jakarta Sans + Be Vietnam Pro), component patterns
- Core shell structure implemented: top bar, bottom navigation, messaging inbox scaffold
- Database schema drafted with initial migration for profiles, content, threads, and messages
- Supabase RLS policies defined for data access control
- Brand and design context documented in `CLAUDE.md`

### Implementation Sprint (2 April 2026)

**ROS-001 — Profile bootstrap:** Verified complete. Migration `0002_profile_bootstrap_policies.sql` adds the three required INSERT RLS policies (`profiles`, `user_roles`, `notification_preferences`). The full auth → profile setup → protected route flow is wired.

**ROS-002 — Live articles & events:** Complete.
- Article detail pages live at `/actualites/[slug]` with full JSONB content block rendering (paragraph, heading, quote, image)
- All article cards across `/actualites`, `/association`, and homepage now link to detail pages
- Seed data extended with a richer article (headings, quotes, multiple paragraphs) for content renderer testing
- Metadata (title + description) generated per article for SEO

**ROS-003 — Live messaging enhancements:** Complete.
- Conversation cards now use Next.js `<Link>` (was `<a>`) for client-side navigation
- FAB button now shows an informational banner explaining that threads are created by the association team
- Real-time message updates implemented: new messages in a thread auto-refresh the page via Supabase Realtime (`postgres_changes` on `messages` table)
- Migration `0004_enable_realtime_messages.sql` enables Realtime publication on the `messages` table
- Thread detail page wraps content in `ThreadRealtimeProvider` without converting the server component

---

## What Needs to Be Done Next

### Charles Mahouve — Technical Lead

| Priority | Task | Notes |
|---|---|---|
| High | Organize app requirements into a functional map | Each screen with navigation flows between pages |
| High | Review specialist booking / agenda feature feasibility | Define what is buildable for v1 vs. later |
| Medium | Review existing website | Identify what to improve and how it connects to the app |
| Medium | Propose weekly check-in format | Start with weekly cadence, agenda template |
| Next sprint | ROS-004 Moderation foundation | Report table, moderation actions, audit log |
| Next sprint | ROS-005 Settings & notification preferences | Wire `/parametres` to Supabase |
| Next sprint | ROS-006 Parcours foundation | Appointments and personal notes (private, user-scoped) |

### Charlie Arnaud — Strategy & Partnerships

| Priority | Task | Notes |
|---|---|---|
| High | Define and refine the app's value proposition | Positioning around cancer support and partner visibility |
| Medium | Contribute to website review | How it complements vs. duplicates the app |
| Medium | Identify useful partnerships and external contacts | Content credibility, visibility, and specialist network |
| Ongoing | Attend weekly follow-up meetings | Help validate evolving scope and priorities |

### Association Rose Sein — Product Owner

| Priority | Task | Notes |
|---|---|---|
| Ongoing | Attend weekly follow-up meetings | Thursdays/Fridays or after 19:30 weekdays |
| Ongoing | Validate functional map once prepared by Charles | Confirm priorities and must-have scope |
| Ongoing | Provide feedback on feature sequencing | What users need first vs. what can wait |

---

## Immediate Next Actions (This Week)

1. **Charles** — Draft the functional map (screens + flows) based on the feature list received from the association
2. **Charles** — Assess specialist booking feasibility and prepare a short options brief
3. **Charlie** — Draft a one-page value proposition for internal alignment
4. **All** — Confirm the first weekly check-in date and time

---

## Recurring Cadence

- **Format**: Weekly check-in
- **Duration**: 30–45 minutes
- **Preferred slots**: Thursdays or Fridays daytime, or weekday evenings after 19:30
- **Agenda template** (to be confirmed):
  1. Progress since last meeting (5 min)
  2. Blockers or open questions (10 min)
  3. Priorities for the coming week (10 min)
  4. Any scope or stakeholder updates (5 min)

---

## Reference Docs

| Document | Purpose |
|---|---|
| `docs/00-executive-summary.md` | Project maturity and business objectives |
| `docs/01-product-architecture.md` | Feature map and module structure |
| `docs/02-system-design.md` | Technical architecture and accessibility model |
| `docs/09-delivery-roadmap.md` | Implementation phases |
| `CLAUDE.md` | Brand, design system, and technical context for the development team |
