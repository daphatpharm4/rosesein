# ROSE-SEIN Risk Register

## Current Top Risks

### R1. Phase 1 cleanup not fully closed

- Severity: Medium
- Description: The main shell and messaging route are now canonical, but the product still needs profile hydration, role-aware rendering, and legacy alias review to fully close the Phase 1 foundation.
- Impact: partial auth foundation, incomplete user-state experience
- Mitigation: connect profile and role loading after login, validate alias behavior, and remove any remaining stale references during the next implementation phase
- Owner: software architect and frontend developer

### R2. Authentication foundation only partially implemented

- Severity: Critical
- Description: Supabase magic-link sign-in, middleware refresh, account entrypoint, and protected route gating now exist, but profile creation and role hydration are not yet connected to live user flows.
- Impact: protected routes can be gated, but the product cannot yet provide a complete authenticated experience
- Mitigation: add authenticated profile bootstrap, role lookup, and post-login onboarding before live data rollout
- Owner: backend architect and security engineer

### R3. Messaging is still mock-driven in the UI

- Severity: High
- Description: Messaging routes render prototype data and do not yet represent actual participant-scoped data access.
- Impact: false sense of feature completeness
- Mitigation: wire live thread loaders and server-side send actions
- Owner: backend architect and frontend developer

### R4. Moderation model incomplete

- Severity: High
- Description: The product scope includes community and anonymous posting, but moderation audit models are incomplete.
- Impact: unsafe rollout of community features
- Mitigation: add reports, moderation actions, audit logs, and service workflows before community launch
- Owner: security engineer and service delivery owner

### R5. Sensitive document model not implemented

- Severity: High
- Description: Journey and document features are in scope but not yet safely implemented.
- Impact: potential exposure if rushed
- Mitigation: private storage design, signed access patterns, and retention policy before any upload feature
- Owner: database optimizer and security engineer

### R6. Public website and app content split is not yet operationally defined

- Severity: Medium
- Description: The app and public website may diverge if content ownership rules remain informal.
- Impact: inconsistent messaging and duplicate editorial effort
- Mitigation: adopt a documented coexistence and governance model
- Owner: brand guardian and content operations owner

### R7. Analytics could become privacy-invasive if implemented ad hoc

- Severity: Medium
- Description: Without a narrow event taxonomy, analytics may capture unnecessary sensitive behavior.
- Impact: trust and compliance risk
- Mitigation: approve privacy-safe analytics taxonomy before instrumentation
- Owner: analytics and privacy owners

## Residual Risk Policy

Every release should explicitly identify:

- newly introduced risks
- mitigated risks
- accepted residual risks
- release owner sign-off
