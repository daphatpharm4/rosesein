# 06. Trust and Moderation

## Objective

Design a support environment where pseudonymity is allowed for dignity, but abusive or unsafe behavior remains traceable and manageable.

## Core Trust Principle

Anonymous presentation is acceptable. Anonymous accountability is not.

## Moderation Scope

The platform must be able to moderate:

- future community posts and replies
- private messaging abuse reports
- misleading or unsafe support content
- impersonation or fake-account behavior

## Required Workflow

1. user submits report or system flags suspicious activity
2. report enters moderation queue
3. moderator reviews context and identity traceability
4. action is recorded
5. escalation occurs if severe

## Pseudonymity Model

| Layer | User sees | Staff sees |
| --- | --- | --- |
| Display identity | pseudonym or masked identity where enabled | real account linkage plus pseudonym |
| Message/report context | public-facing safe identity | participant traceability |
| Enforcement history | hidden | auditable by moderators and admins |

## Anti-Abuse Controls

- participant membership checks for every thread read or write
- duplicate account heuristics based on device, timing, and behavioral patterns where legally appropriate
- rate-limits for message creation, report submission, and future post creation
- anomaly review for bursts of new accounts or identical content

## Suggested Evidence Model

For each moderation case, capture:

- reporter
- target entity
- content snapshot or reference
- timestamps
- current confidence
- decision
- decision owner
- escalation status

## Confidence Scoring Direction

Confidence scoring should support operations, not automate punishments.

### Example levels

- High: direct evidence, repeated pattern, validated report
- Medium: suspicious pattern, limited evidence, requires human review
- Low: weak signal, monitor only

## Human Oversight Rules

- no automatic permanent sanctions in MVP
- moderator decisions must be reversible by admin
- severe safety concerns need a defined escalation owner
- moderation backlog must be reviewed on a schedule

## MVP Recommendation

Launch with:

- association messages
- participant-scoped private messaging
- reporting foundation
- moderator traceability

Defer:

- public community posting
- broad reaction systems
- mentorship matching automation

## Do-Not-Ship Criteria

- pseudonymous participation without staff traceability
- messaging without report and escalation path
- volunteer access to moderation data by default
