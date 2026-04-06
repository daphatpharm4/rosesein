# 16. Moderation Workflow

## Purpose

`ROS-004` adds the first live moderation loop for private messaging without opening broader community features.

## App Behaviors Tied To This Workflow

### Member-side reporting

- Members can report a specific message from `/messages/[threadId]`.
- Each report stores:
  - reporter
  - target message
  - target thread
  - target member linkage when available
  - reason
  - optional context

### Staff-side review

- Moderators and admins review reports at `/admin/moderation`.
- Each moderation action is recorded with:
  - action type
  - decision owner
  - timestamp
  - optional notes
  - escalation owner for severe cases

### Auditability

- Report creation appends an audit entry.
- Moderation action creation appends an audit entry.
- Audit records remain staff-visible only.

## Operational Sequence

1. A member reports a message in the protected messaging route.
2. The report enters the moderation queue with thread and message context.
3. A moderator records a review note, warning, closure, or escalation.
4. Severe cases move to `escalated` with a named escalation owner.

## MVP Guardrails

- No automatic permanent sanctions.
- No volunteer-by-default access to moderation data.
- Pseudonymous presentation never removes staff traceability.
- Message reporting is limited to authenticated participants of the thread.

## Relevant Tables

- `content_reports`
- `moderation_actions`
- `audit_log`

## Related Routes

- `/messages/[threadId]`
- `/admin/moderation`
