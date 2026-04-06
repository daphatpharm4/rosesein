# 01. Product and Domain Analysis

## Scope

This analysis translates the current ROSE-SEIN website and repository into a product operating model for a privacy-first support platform. It distinguishes current reality from MVP ambition.

## Confirmed Current-State Inputs

- Public institutional website already exists at `rosesein.org`.
- Current repository already contains:
  - public pages for home, `actualites`, and `association`
  - protected scaffolding for `messages`, `parcours`, and `parametres`
  - a Supabase-backed auth foundation
  - a first migration for profiles, roles, articles, events, threads, messages, and notification preferences
- Messaging UI is still mock-driven through `lib/messages.ts`.
- Public website content pillars remain broader than the current app content model.

## Core User Groups

| User group | Primary need | Current support state | MVP gap |
| --- | --- | --- | --- |
| Patientes | trusted information, calm support, safe private exchange, practical coordination | editorial direction present, protected route scaffolding present | no live onboarding, no live messages, no journey data |
| Aidants | orientation, support content, communication with association | conceptual support only | no caregiver-specific live experience yet |
| Association admins | publishing, events, coordination, institutional messaging | partial public pages and early docs | no live admin back office, no workflows in product |
| Moderators | reports, abuse review, traceability, safety enforcement | role model exists in schema | no report queue, no moderation UI, no audit log |
| Volunteers | scoped participation and support | not implemented | no scoped access model in UI or flows |

## Website-to-App Domain Reality

The public website currently carries the broad institutional editorial burden. Confirmed public themes include:

- information about the association
- diagnosis and treatment understanding
- living with breast cancer
- beauty and wellbeing
- nutrition
- news and blog-like editorial content
- volunteer, partner, and donation surfaces

The app should not try to replace this public estate immediately. MVP should specialize in authenticated support and operational coordination while selectively mirroring the highest-value editorial surfaces.

## Capability Assessment

| Capability | Current state | Operational reality | Main risk | MVP direction |
| --- | --- | --- | --- | --- |
| Accueil | live editorial home scaffold | useful as orientation hub | promises more than backend supports | keep as calm hub with live content cards later |
| Compte | magic-link auth entry exists | enough for foundation work | no profile hydration | finish patient or aidant onboarding |
| Actualités | public page exists | good fit for website-app bridge | duplicated editorial ownership | start with curated synced content only |
| Soins de support | only conceptual | depends on editorial curation and partner review | content quality drift | launch with curated categories, not deep personalization |
| Communauté | not implemented | high moderation load | unsafe launch | defer to post-moderation phase |
| Chat | protected route exists, mock content | strongest support value if scoped | false sense of readiness | launch association and limited private threads first |
| Mon parcours | protected placeholder route | sensitive, high-trust feature | document and note privacy risk | start with appointments and notes only |
| Association | public page exists | strong trust and fundraising surface | split public vs in-app ownership | keep public-forward with app entry CTA |
| Notifications | preference table exists | useful but secondary | noisy, trust-eroding rollout | launch only essential digest and message alerts |
| Aide et urgence | conceptual only | needs clear non-medical boundaries | clinical misinterpretation | ship as orientation and emergency-resource surface only |
| Paramètres | protected placeholder route | needed for privacy and notifications | weak without profile model | link to profile, privacy, and notification settings |

## Field Reality and Adoption Constraints

- The product serves emotionally and physically fatigued users. Complex onboarding and dense layouts will lose trust quickly.
- Messaging and community features create an expectation of responsiveness. Support operating ownership must exist before launch.
- Anonymous or pseudonymous participation is valuable, but only if staff can trace harmful behavior server-side.
- Website visitors are likely the top-of-funnel source; app conversion must happen from trust, not from aggressive growth mechanics.
- Sponsors and institutional partners will care about measurable support outcomes more than app novelty.

## Current Data and Content Risks

| Risk area | Why it matters | Current posture | Required move |
| --- | --- | --- | --- |
| Editorial quality | health-adjacent advice requires validation | public site is authoritative, app is not | define validator and publisher roles |
| Messaging safety | private exchange can become unsafe or unsupported | schema exists, workflow does not | add moderation and escalation model |
| Journey privacy | appointments, notes, and documents are highly sensitive | not implemented | ship in phases with private storage only |
| Role ambiguity | patient, aidant, moderator, admin are different dimensions | modeled in docs, not fully hydrated in app | complete profile and role bootstrap |
| Website-app duplication | same content can diverge across channels | currently unresolved | assign canonical owner per content type |

## Recommended Product Thesis

ROSE-SEIN should be positioned as trusted digital support infrastructure for association-led accompaniment, not as a generic social app and not as a medical decision system.

## Immediate Recommendations

1. Treat validated content, events, protected messaging, and service operations as the MVP core.
2. Keep community posting and secure document upload out of the first live wave.
3. Make the website the public educational front door and the app the private support environment.
4. Finish profile creation, profile kind selection, and role hydration before live feature rollout.
