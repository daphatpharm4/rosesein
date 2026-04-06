# ROSE-SEIN Cloud Platform

## Platform Overview

ROSE-SEIN is designed for:

- Next.js on Vercel
- Supabase for auth, database, storage, and optional realtime

This pairing is appropriate for the current maturity level, but only if environment separation, migrations, secrets handling, and rollback procedures are documented and enforced.

## Environment Model

### Recommended environments

- local
- development
- preview
- production

### Vercel mapping

- local: developer machine
- development: optional long-lived shared environment
- preview: Vercel preview deployments from branches
- production: primary user-facing environment

### Supabase mapping

Minimum recommended:

- one non-production Supabase project
- one production Supabase project

Preferred:

- development project
- staging or preview-compatible project
- production project

## Secrets Handling

### Current variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Required principles

- no service-role keys in client code
- server-only credentials remain server-only
- environment variables must be documented per environment
- no secrets committed to the repository

## Deployment Workflow

### Application deploy

1. branch is reviewed
2. preview deployment is created on Vercel
3. verification is performed
4. production deploy is promoted after approval

### Database deploy

1. schema change is authored as a migration
2. migration is reviewed for safety and rollback
3. migration is applied to non-production
4. app verification is run
5. migration is applied to production in a controlled window

Application deployment and database migration must be treated as separate release activities.

## CI/CD Direction

The repository should move toward a CI/CD contract that runs:

- install
- typecheck
- build
- test when available
- migration validation when practical

## Rollback Strategy

### App rollback

- rollback to prior Vercel deployment
- confirm route, auth, and rendering stability

### Database rollback

- define reversible migrations where possible
- document non-reversible migrations explicitly
- for risky migrations, include manual rollback and data restoration steps

## Backup and Recovery

### Minimum expectation

- production database backup policy documented
- recovery owner and recovery procedure documented
- storage recovery assumptions documented

### Recommended

- pre-release backup checkpoint for high-risk migrations
- recovery exercise for critical data domains

## Observability and Alerting

The platform should move toward a minimum observability stack that covers:

- build and deploy failures
- auth errors
- message send or load failures
- migration errors
- privileged moderation failures
- storage access failures

Recommended alert categories:

- deploy failure
- auth outage
- database migration failure
- elevated application error rate
- storage access denial anomalies

## Cloud Engineering Decisions

- keep the platform simple at this stage
- avoid introducing extra infrastructure layers before the core product is live
- prioritize safe environment separation, repeatable migrations, and rollback clarity over advanced platform complexity
