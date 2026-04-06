# ROSE-SEIN MVP Launch Prompt

```text
Create a sequential agent team to produce the fastest credible MVP launch strategy for ROSE-SEIN.

Project context:
- ROSE-SEIN is a privacy-first support platform for breast cancer patients, caregivers, moderators, volunteers, and the association team.
- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Vercel.
- Public website: https://rosesein.org/
- Current repo state:
  - magic-link auth foundation exists
  - protected route group exists
  - public pages exist for home, actualités, and association
  - messaging UI exists but is still mock-backed
  - Supabase schema exists for profiles, roles, articles, events, threads, messages, and notification preferences

Mission:
Produce a concrete MVP launch strategy that gets ROSE-SEIN from foundation to a safe, limited production pilot in 6 weeks.

Constraints:
- Optimize for safe launch, not feature breadth.
- Treat the website as the public trust layer and the app as the private support layer.
- Do not include open community features, document upload, or AI guidance in MVP unless there is a hard justification.
- Every recommendation must clearly distinguish:
  - what already exists
  - what must be added for MVP
  - what is explicitly deferred

Required workstreams:
1. Product and scope definition
2. System design and route normalization
3. Cloud and delivery workflow
4. Cybersecurity and privacy gating
5. Messaging and moderation readiness
6. UX and onboarding simplification
7. Launch operations and support ownership

Required deliverables:
- one MVP scope document
- one current-state vs MVP gap matrix
- one 6-week implementation plan
- one launch readiness checklist
- one do-not-ship register
- one pilot KPI set

Output quality bar:
- no generic startup advice
- no “nice to have” sprawl
- recommendations must be implementation-ready
```
