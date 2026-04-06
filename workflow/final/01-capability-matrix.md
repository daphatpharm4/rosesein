# 01. Capability Matrix

| Capability | User groups | Data needed | Actors | Current state | MVP delta from current repo | Main risks |
| --- | --- | --- | --- | --- | --- | --- |
| Accueil | patients, caregivers | greeting state, featured content, next event, association message | product, editorial | live scaffold | wire live article and event cards | overpromising before data is live |
| Compte | all signed-in users | email, profile kind, display name, pseudonym, notification defaults | user, backend | magic-link auth live | add profile bootstrap and role hydration | trust drop from incomplete onboarding |
| Actualités | public and signed-in users | articles, categories, publication state | editorial, validator | public scaffold | live Supabase article queries, publishing workflow | stale or unvalidated content |
| Soins de support | patients, caregivers | curated categories and resources | editorial, partners | conceptual only | limited curated support content | content quality drift |
| Chat | members, association staff | threads, participants, messages | user, association, moderator | protected UI, mock data | live participant-scoped messaging | unsafe or unsupported conversations |
| Parcours | signed-in users | appointments, notes, later documents | user | placeholder route | appointments and notes first | privacy and storage risk |
| Association | public users, partners, donors | association pages, events, partner content, CTA | association admin | public scaffold | unify content ownership and CTA flow | split website-app ownership |
| Notifications | signed-in users | preference state, event/message triggers | user, system | table exists only | add settings UI and limited triggers | noisy rollout hurts trust |
| Aide | all users | contacts, FAQ, support escalation paths | support owner | not built | simple orientation/help surface | clinical misunderstanding |
| Paramètres | signed-in users | profile, privacy choices, notifications | user, backend | placeholder route | live profile and preference editing | weak privacy transparency |
| Moderation | moderators, admins | reports, actions, audit trail | moderator, admin | not implemented | reports and action logging | no safe scale path for UGC |
