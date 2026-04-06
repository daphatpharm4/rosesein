# 04. Cloud Engineering Plan

## Objective

Turn the target architecture into a repeatable delivery workflow.

## Tooling Baseline

| Area | Current tool | Recommendation |
| --- | --- | --- |
| App framework | Next.js | keep |
| Language | TypeScript | keep |
| Styling | Tailwind CSS | keep |
| Hosting | Vercel | keep |
| Data and auth | Supabase | keep |
| Package management | npm | keep for current repo continuity |

## Delivery Workflow

### Application

1. branch change
2. preview deployment on Vercel
3. review against acceptance criteria
4. promote to production

### Database

1. author migration
2. review RLS and rollback impact
3. apply in non-production
4. validate app behavior
5. apply in production during controlled release window

Application and database releases must remain separate steps.

## Implementation Work Packages

### Package A: Auth and profile bootstrap

- create profile row on first login
- resolve profile kind and role server-side
- expose signed-in state cleanly in UI

### Package B: Live content and events

- wire articles and events to Supabase queries
- distinguish public published content from draft/admin content

### Package C: Live messages

- replace `lib/messages.ts` mocks
- load threads by participant membership
- add send action with authorization checks

### Package D: Moderation foundation

- add report tables
- add moderation action tables
- add audit log for privileged actions

### Package E: Journey foundation

- appointments
- personal notes
- defer document upload until storage policy is implemented

## Observability Minimum

Track at minimum:

- build failures
- deployment failures
- auth callback errors
- protected route access failures
- message load and send failures
- migration errors

## Runbooks Needed

- deploy rollback
- auth issue triage
- migration rollback or recovery
- moderation queue outage
- privacy incident escalation

## Practical Engineering Sequence

1. finish auth and profile bootstrap
2. connect public content and events
3. connect participant-scoped messaging
4. add moderation data and operating workflow
5. add private journey features

## Engineering Recommendation

The repo does not need more scaffolding. It needs progressive replacement of placeholders with live, testable server-backed flows.
