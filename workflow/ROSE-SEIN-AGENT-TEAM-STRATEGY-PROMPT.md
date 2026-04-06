# ROSE-SEIN Agent Team Strategy Prompt

**Date:** April 2, 2026  
**Use:** paste into a fresh Codex session when you want a sequential agent team to research and propose the best product, technical, operational, and go-to-market strategy for ROSE-SEIN

---

## Prompt

```text
Create an agent team to research and propose the best strategy for ROSE-SEIN, a privacy-first digital companion for breast cancer patients, caregivers, volunteers, moderators, and the association team.

Project context:
- Product: ROSE-SEIN
- Type: health-adjacent support and association platform, not a diagnostic or emergency medical tool
- Current app stack:
  - Next.js App Router
  - TypeScript
  - Tailwind CSS
  - Supabase
  - Vercel
- Current public website: `https://rosesein.org/`
- Current product direction:
  - accueil
  - compte utilisateur
  - actualités
  - soins de support
  - communauté
  - chat
  - mon parcours
  - association
  - notifications
  - aide et urgence
  - paramètres
- Core product principles:
  - calm and reassuring
  - privacy-first
  - readability during fatigue or treatment
  - active moderation
  - possible anonymity with moderator traceability
  - no manipulative growth mechanics
  - no intrusive advertising

Mission:
Research and propose the best end-to-end strategy to turn ROSE-SEIN from its current foundation into an operational, safe, scalable, and commercially viable product for the association. The team must cover product architecture, system design, cloud delivery, cybersecurity, analytics, marketing, UX, and service delivery.

Folder rule:
- Create a dedicated folder called `workflow`
- Put all deliverables inside `workflow`
- Inside `workflow`, create:
  - `workflow/research/` for teammate outputs, raw findings, and notes
  - `workflow/final/` for the synthesized final strategy and executive deliverables

Execution rule:
- Each teammate waits for the previous one to finish
- The lead synthesizes all outputs into one final strategy
- Every teammate must leave a concrete written artifact in `workflow/research/`
- Final synthesis must live in `workflow/final/`

Final output must include:
1. Capability-by-capability matrix:
   - user groups
   - data needed
   - actors
   - workflows
   - likely problems
   - current gaps
   - MVP delta from current repo state
2. Recommended implementation mix per capability:
   - build in app
   - reuse from public website
   - Supabase native capability
   - partner workflow
   - manual operations
   - future integration
3. 6-week MVP pilot plan:
   - budget
   - team roles
   - weekly milestones
   - KPIs
4. Priority stakeholder, partner, and vendor contact list:
   - local association and support actors
   - medical and wellbeing partners
   - content and moderation stakeholders
   - technical vendors and service providers
5. Risk register and mitigation plan
6. 80/20 focus:
   - top 20% of features, data points, and workflows that create 80% of user and association value
7. Clear validation SOP:
   - draft or capture
   - verify
   - moderate or approve
   - score confidence or readiness
   - publish or release
   - monitor and revise

Teammate 1: Product and Domain Analyst
- Research the real ROSE-SEIN context:
  - user groups
  - existing website content
  - association realities
  - support workflows
  - likely adoption barriers
  - data quality and operating risks by capability
- Deliverable:
  - `workflow/research/01-product-and-domain-analysis.md`

Teammate 2: System Design Expert
- Design the end-to-end product and system workflow:
  - canonical route map
  - module boundaries
  - entity model
  - baseline vs ongoing updates
  - how association content, private user data, and moderation data remain separated
- Deliverable:
  - `workflow/research/02-system-design.md`

Teammate 3: Cloud Architect
- Propose the target technical architecture:
  - Next.js + Supabase + Vercel target topology
  - offline-first or low-connectivity needs if relevant
  - storage and sync model
  - APIs
  - environments
  - cost and reliability tradeoffs
- Deliverable:
  - `workflow/research/03-cloud-architecture.md`

Teammate 4: Cloud Engineer
- Translate the architecture into practical implementation steps:
  - tooling
  - deployment approach
  - migration workflow
  - observability
  - release runbooks
  - rollout checklist
- Deliverable:
  - `workflow/research/04-cloud-engineering-plan.md`

Teammate 5: Cybersecurity Expert
- Define security, privacy, and compliance controls:
  - auth and authorization
  - consent
  - GDPR-relevant handling
  - storage privacy
  - secret management
  - incident response
- Deliverable:
  - `workflow/research/05-cybersecurity-and-privacy.md`

Teammate 6: Trust, Moderation, and Abuse Specialist
- Design anti-abuse and trust controls:
  - anonymous posting with traceability
  - duplicate detection
  - fake account or misuse indicators
  - moderation queues
  - confidence and trust scoring where useful
- Deliverable:
  - `workflow/research/06-trust-and-moderation.md`

Teammate 7: Marketing and Growth Strategist
- Identify the strongest user acquisition and stakeholder value paths:
  - target paying or sponsoring entities
  - best product narratives
  - strongest use cases
  - how consistency, trust, and support outcomes convert into institutional value
  - website-to-app conversion opportunities
- Deliverable:
  - `workflow/research/07-marketing-and-growth.md`

Teammate 8: UI/UX Designer
- Research and propose the best UI layout and interaction model:
  - simple to use
  - emotionally safe
  - visually distinctive
  - readable during fatigue
  - accessible on mobile first
- Deliverable:
  - `workflow/research/08-ui-ux-strategy.md`

Teammate 9: Service Delivery Manager / Project Leader
- Create the execution plan:
  - owners
  - milestones
  - dependencies
  - RAID log
  - governance cadence
  - support and moderation operating model
- Deliverable:
  - `workflow/research/09-service-delivery-and-project-plan.md`

Lead synthesizer:
- Consolidate all teammate outputs into:
  - one executive summary
  - one final delivery strategy
  - one MVP pilot plan
  - one prioritized roadmap
- Final deliverables:
  - `workflow/final/00-executive-summary.md`
  - `workflow/final/01-capability-matrix.md`
  - `workflow/final/02-implementation-mix.md`
  - `workflow/final/03-6-week-mvp-pilot.md`
  - `workflow/final/04-stakeholder-and-partner-list.md`
  - `workflow/final/05-risk-register.md`
  - `workflow/final/06-80-20-focus.md`
  - `workflow/final/07-validation-sop.md`
  - `workflow/final/08-prioritized-roadmap.md`

Research constraints:
- Use the current repository as source-of-truth for what already exists
- Use the public website as source-of-truth for current association-facing editorial and brand context
- Do not assume the app is already feature-complete
- Distinguish clearly between:
  - what exists now
  - what is proposed for MVP
  - what belongs in later phases

Decision principles:
- Privacy before growth
- Simplicity before feature sprawl
- Moderator traceability before anonymous posting
- Canonical architecture before acceleration
- Operational readiness before scaling

Output quality bar:
- No generic startup advice
- No vague “should consider” language without a recommendation
- Every section must say:
  - current state
  - proposed state
  - why
  - owner
  - dependencies
  - risks

Start by:
1. scanning the current repo and docs
2. summarizing current-state capability and architecture
3. creating the `workflow/` folder structure
4. launching the teammate sequence in the specified order
5. writing the final synthesis only after all teammate deliverables exist
```

---

## Notes

- This version adapts the original Bonamoussadi vertical-research prompt to the ROSE-SEIN product context.
- It keeps the same sequential multi-agent structure but swaps market-data collection deliverables for product, platform, trust, content, and service-delivery deliverables that fit this repository.
- It resolves the original folder conflict by using `workflow/` as the top-level deliverable folder and `workflow/research/` plus `workflow/final/` as the substructure.
