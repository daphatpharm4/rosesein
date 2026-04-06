# 07. Validation SOP

## Purpose

Every sensitive or trust-relevant workflow in ROSE-SEIN should follow a predictable validation path. The goal is not bureaucracy. The goal is safe publication, safe support, and traceable change control.

## Universal Flow

1. capture or draft
2. verify
3. score readiness or confidence
4. approve or moderate
5. publish or release
6. monitor and revise

## Content SOP

### Capture

- article or event draft is created

### Verify

- editorial owner checks structure and clarity
- validator checks factual or support-sensitive claims where needed

### Score readiness

- Ready: can publish now
- Needs edits: must be revised
- Blocked: should not publish

### Publish

- publisher records who approved and when

### Monitor

- review freshness
- update or retire stale content

## Messaging and Support SOP

### Capture

- user sends message or opens support request

### Verify

- server checks authenticated access and thread participation

### Score confidence

- Normal: standard support flow
- Needs attention: sensitive or unclear
- Escalate: safety, privacy, or severe misuse concern

### Approve or moderate

- normal messages flow
- flagged items enter moderation or escalation path

### Monitor

- response time
- unresolved backlog

## Moderation SOP

### Capture

- report submitted or system flags anomaly

### Verify

- moderator reviews target content, actor traceability, and prior context

### Score confidence

- low, medium, or high based on evidence

### Act

- dismiss
- warn
- restrict
- escalate to admin

### Publish record

- log action, owner, and timestamp

## Release SOP

### Capture

- code change and migration change are documented separately

### Verify

- typecheck
- build
- non-production validation
- route, auth, and RLS review for sensitive features

### Score readiness

- ship
- hold
- rollback required

### Publish

- deploy app
- apply production migration if approved

### Monitor

- auth errors
- message failures
- content and support regressions

## Rule

If a workflow changes user trust, safety, privacy, or visibility, it must have a named owner at each step.
