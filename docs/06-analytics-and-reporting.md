# ROSE-SEIN Analytics and Reporting

## Measurement Principle

ROSE-SEIN should measure product effectiveness without compromising trust, privacy, or dignity. This is not an ad-tech product. Analytics must be narrow, purposeful, and respectful.

## Measurement Objectives

Analytics should answer:

- are users finding the right support paths quickly?
- are validated content and events being discovered?
- are messaging and support features being adopted safely?
- are moderators and association staff able to operate efficiently?
- where are users dropping out of key journeys?

## KPI Framework

### Product health KPIs

- active users by role
- onboarding completion rate
- profile completion rate
- first-message initiation rate
- event discovery and registration rate
- return usage across key support surfaces

### Content KPIs

- validated article views
- event views
- click-through from app to public website content
- conversion from website content to in-app account creation

### Support and service KPIs

- response time for association-managed conversations
- moderation review time
- report resolution time
- support request closure rate

### Safety KPIs

- abusive content report volume
- moderation backlog
- access-denied anomaly rate

## Event Taxonomy Direction

### Core identity events

- `account_created`
- `profile_kind_selected`
- `notification_preferences_updated`

### Content events

- `article_viewed`
- `event_viewed`
- `event_registration_started`
- `event_registration_completed`

### Messaging events

- `thread_list_viewed`
- `thread_opened`
- `message_sent`

### Service and support events

- `help_surface_opened`
- `support_contact_selected`
- `report_submitted`

## Privacy-Safe Measurement Rules

- do not record message content
- do not record note content
- do not record document content
- do not create invasive health profiling through telemetry
- avoid excessive user-level tracking for sensitive flows
- aggregate wherever detailed identity is not necessary

## Reporting Audiences

### Product and engineering

- feature adoption
- technical friction
- route and conversion drop-off

### Association leadership

- content reach
- event engagement
- support operations health
- community safety indicators

### Service delivery and moderators

- backlog size
- response times
- moderation closure metrics

## Recommended Reporting Cadence

- weekly operational check-in
- monthly product and association review
- quarterly strategic review

## Dashboard Recommendations

Initial dashboards should cover:

- product activation
- content engagement
- messaging activity
- moderation and support operations

## Implementation Notes

Do not implement analytics before documenting:

- exact event names
- event owners
- which fields are allowed
- where events are emitted
- how privacy review is applied
