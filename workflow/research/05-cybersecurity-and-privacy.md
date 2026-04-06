# 05. Cybersecurity and Privacy

## Security Position

ROSE-SEIN must be treated as a sensitive support platform from the first live release. The right question is not whether it stores formal clinical records. The right question is whether a breach, misuse, or unsafe workflow would harm vulnerable people. The answer is yes.

## Primary Assets

- profile identity and profile kind
- roles and permissions
- messages and participation metadata
- future notes, appointments, and documents
- moderation records
- private operational data

## Current Controls

- Supabase auth foundation exists
- protected route middleware exists
- RLS exists on core messaging and profile tables
- roles are modeled separately from profiles

## Current Gaps

- no full profile bootstrap on login
- no audit log table
- no moderation UI
- no rate-limiting design for abuse-prone flows
- no incident communication workflow in product operations

## Required Security Controls

### Identity and authorization

- complete post-login profile hydration
- resolve role server-side on every privileged path
- keep moderator and admin capabilities separate

### Data protection

- private-by-default storage
- no sensitive content in public buckets
- avoid exposing thread participation metadata outside authorized scope

### Application controls

- validate all server actions
- add anti-automation and abuse protection to sign-in and report flows
- create audit records for content publishing, moderation actions, and role changes

### Secrets and environments

- keep service-role keys server-only
- document variable ownership by environment
- rotate secrets on environment changes or compromise

## GDPR-Relevant Handling

| Data area | Handling principle |
| --- | --- |
| Profiles | minimal data collection, clear purpose |
| Messages | content never used for marketing analytics |
| Journey data | explicit high-sensitivity classification |
| Analytics | aggregate where possible, no invasive profiling |
| Documents | private storage only, retention policy required |

## Consent and User Trust Rules

- explain why profile kind is requested
- explain pseudonymity clearly
- explain what moderators can still trace
- avoid ambiguous or manipulative consent language

## Incident Response Model

1. classify incident
2. contain affected surface
3. preserve evidence
4. identify impacted users and data domains
5. communicate internally
6. execute recovery
7. document root cause and corrective action

## Do-Not-Ship Criteria

Do not ship a feature when:

- route protection and RLS behavior have not been reviewed together
- sensitive data can be fetched client-side without server gating
- moderation owners are missing for user-generated content
- document storage uses public delivery

## Recommendation

Finish profile and role hydration, add audit-ready moderation structures, and keep the first live release intentionally narrow.
