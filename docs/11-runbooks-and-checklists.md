# ROSE-SEIN Runbooks and Checklists

## Local Development Runbook

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Verify typecheck and build:

```bash
npm run typecheck
npm run build
```

## Deployment Checklist

Before production deploy:

- environment variables reviewed
- route changes reviewed
- migrations reviewed
- rollback path documented
- support owners informed
- release scope approved

## Migration Checklist

Before applying a migration:

- purpose documented
- impacted tables listed
- RLS impact reviewed
- rollback approach documented
- non-production validation completed

## Content Publishing Checklist

- content owner assigned
- validation complete
- category assigned
- publication target confirmed
- support or contact path included when relevant

## Moderation Readiness Checklist

- reports can be created
- reports can be reviewed
- actions are auditable
- escalation path exists
- moderation owner is on duty

## Incident Checklist

When an incident is suspected:

- classify impact
- identify affected surfaces
- freeze risky deploys if needed
- notify owner
- collect evidence
- communicate status
- document recovery steps

## Release Communication Checklist

- release note written
- support and association teams informed
- high-risk change notes included
- rollback decision owner identified

## Current Verification Baseline

The initial app scaffold has already been verified with:

- `npm install`
- `npm run typecheck`
- `npm run build`

These checks validate the current application foundation, not the future feature-complete platform.
