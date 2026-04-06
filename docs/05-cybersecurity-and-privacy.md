# ROSE-SEIN Cybersecurity and Privacy

## Security Position

ROSE-SEIN handles sensitive personal and health-adjacent interactions. The platform must be built with a defensive posture from the start. This is not an app where security can be deferred to a later hardening pass.

## High-Level Threat Model

### Threat actors

- anonymous internet attackers
- authenticated but abusive users
- accidental internal misuse
- privilege escalation attempts
- data scraping or public exposure via configuration mistakes

### Primary assets

- identity and profile data
- roles and privileges
- messages
- participation in groups or mentorship spaces
- notes and appointments
- uploaded documents
- moderation records

## Current Security Controls

The repository already includes:

- a role model for `member`, `moderator`, and `admin`
- profiles separated from roles
- RLS enabled on initial patient-facing and messaging tables
- participant-based messaging access patterns
- server and browser Supabase helper separation
- session refresh middleware
- protected route gating for messaging, journey, and settings surfaces

## Current Security Gaps

- authentication foundation exists, but profile creation and role hydration are not yet completed
- no moderator or admin tooling in the UI
- no audit log table for privileged actions
- no secure document upload or storage path implemented yet
- no abuse throttling or rate-limiting layer documented yet
- no incident response runbook in code or operations yet

## Authorization Matrix

### Member

- can access own profile
- can access own notification preferences
- can read or write only in authorized conversations
- cannot perform moderation or administrative tasks

### Volunteer

- should remain a scoped platform role, not an automatic staff role
- may be granted access only to specific operational spaces

### Moderator

- can review reports and moderate community spaces
- can access broader but still controlled moderation data
- should not automatically gain full administrative power

### Admin

- can manage content, roles, and privileged operations
- must have traceable actions

## Privacy Principles

- collect only data necessary for service delivery
- separate public and private content domains clearly
- preserve user dignity in all analytics, support, and moderation flows
- do not expose private participation in sensitive groups without explicit authorization
- do not make sensitive documents public under any condition

## Anonymous Posting Principle

Anonymous posting must be implemented as:

- pseudonymous or masked public presentation
- full server traceability for staff
- explicit moderation support

It must not be implemented as anonymous authentication, disposable identity, or untraceable user creation.

## Required Security Controls

### Identity and access

- session-aware protected routes
- server-side authorization checks
- least-privilege role grants
- strong separation of moderator and admin actions

### Data and storage

- private buckets only for sensitive documents
- signed URL or controlled server delivery
- storage access logging where feasible

### Application controls

- input validation on all server mutations
- report and abuse handling flows
- rate-limiting for auth-sensitive and abuse-prone actions
- moderation audit records

### Operational controls

- secret rotation process
- environment separation
- migration review for security impact
- incident escalation path

## GDPR-Relevant Considerations

- identify lawful basis per major data domain
- document retention expectations
- document how users can request support for account and data concerns
- avoid unnecessary telemetry on sensitive flows
- review all analytics through a privacy-safe measurement lens

## Residual Security Risks

See the main register in [10-risk-register.md](/Users/charlesvictormahouve/Documents/rosesein/docs/10-risk-register.md), but current top cyber risks are:

- auth not yet implemented
- duplicate architecture paths increasing review surface
- messaging still mock-backed in UI
- moderation and audit structures incomplete
