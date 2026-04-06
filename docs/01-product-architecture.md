# ROSE-SEIN Product Architecture

## Product Intent

ROSE-SEIN is designed as a digital sanctuary: a calm, readable, privacy-first experience that helps users find support, trustworthy information, and human connection without overwhelming them.

## User Groups

### Primary end users

- patients
- caregivers

### Secondary end users

- volunteers
- moderators
- association administrators

## Core Product Areas

### Public and editorial

- home and orientation
- association presentation
- validated news and educational content
- events and workshops
- support-care content:
  - nutrition
  - adapted physical activity
  - beauty and self-image
  - psychological support

### Authenticated user experience

- account and profile
- messaging
- community
- personal journey
- notification preferences
- help and support

### Operational and privileged

- content administration
- moderation
- user and role management
- service delivery workflows

## Current Implemented Route State

Implemented or present routes currently include:

- `/`
- `/messages`
- `/messagerie`
- `/actualites`
- `/association`
- `/parcours`
- `/parametres`

This current state shows route duplication and mixed naming conventions. The target architecture must reduce this drift.

## Canonical Route Direction

For the next phase, the canonical route map should be:

- `/`
- `/messages`
- `/actualites`
- `/soins`
- `/communaute`
- `/parcours`
- `/association`
- `/notifications`
- `/aide`
- `/parametres`
- `/account`
- `/admin`

### Route normalization decision

- Keep `/messages` as the canonical messaging route because it is already connected to the newer shell and build path.
- Treat `/messagerie` as a temporary legacy alias or migration route.
- Maintain French UI labels even if the route slug strategy stays mixed for technical continuity.

## Role Model

There are two related role dimensions and they must remain separate.

### Identity and audience dimension

- patient
- caregiver

### Platform authorization dimension

- member
- volunteer
- moderator
- admin

### Rule

Anonymous posting is not a user role. It is a posting mode layered on top of authenticated users with moderator traceability preserved server-side.

## Product Domain Map

### Domain: Profiles

- identity
- profile kind
- pseudonym settings
- notification preferences

### Domain: Editorial content

- articles
- categories
- validation workflow
- association messaging

### Domain: Events

- workshops
- support groups
- association events

### Domain: Messaging

- association threads
- direct messages
- group threads
- mentorship threads

### Domain: Community

- discussion spaces
- posts
- replies
- reactions
- reports
- moderation outcomes

### Domain: Journey

- medical or support appointments
- notes
- optional wellbeing tracking
- secure documents

### Domain: Association operations

- volunteer calls
- partner presentation
- donations
- admin publishing

## Website-to-App Content Strategy

The public website `https://rosesein.org/` remains the current institutional and editorial anchor. Its major content pillars should be treated as structured source material for the app:

- anatomy and education
- diagnosis and treatment understanding
- living with breast cancer
- beauty and wellbeing
- nutrition
- blog and news
- association pages
- volunteer, partner, and donation flows

### Recommended coexistence model

Short term:

- keep the public website as the primary public editorial source
- deep-link to it where the app does not yet own the content

Medium term:

- introduce an app-managed content model in Supabase for:
  - actualités
  - events
  - support-care resources
  - association announcements

Long term:

- decide whether the website and app content should:
  - share a single editorial backend
  - be migrated into Next.js
  - or remain separate but synchronized through a documented workflow

## User Journey Priorities

### Patient journey

1. discover trustworthy support
2. create account
3. choose patient profile
4. access messages, content, and events
5. store notes and documents safely
6. receive relevant notifications without overload

### Caregiver journey

1. identify caregiver-specific guidance
2. create account
3. access support content and community
4. coordinate with the association and private contacts

### Moderator or admin journey

1. publish or validate content
2. review reports or manage conversations
3. coordinate events and responses
4. maintain a safe and respectful environment

## Product Architecture Decisions

- Calm mobile-first UX is a product requirement, not a visual preference.
- Sensitive data must stay in authenticated surfaces only.
- Association content and user-generated content must remain clearly separated.
- Messaging, community, and journey features depend on a reliable auth and authorization model.
