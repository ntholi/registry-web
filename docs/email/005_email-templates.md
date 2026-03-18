# Step 005: Email Templates

## Introduction

With the sending pipeline from Step 004, this step creates the branded HTML email templates using `react-email`. Templates are server-rendered to HTML strings and fed into the `sendEmail()` function's `htmlBody` parameter. Each template follows a consistent university-branded layout.

## Context

- `react-email` provides React components for building emails that render to HTML strings.
- Templates are server-only — they are rendered at send time using `render()` from `@react-email/render`.
- The base layout provides consistent branding (university logo, colors, footer).
- Individual templates compose the base layout with event-specific content.

## Requirements

### 1. Dependencies

Install:

| Package | Purpose |
|---------|---------|
| `@react-email/components` | Email component primitives (Html, Head, Body, Container, Text, Link, etc.) |
| `@react-email/render` | `render()` function to convert React components to HTML strings |

### 2. Base Layout

**File:** `src/app/admin/mails/_templates/BaseLayout.tsx`

A shared email layout wrapping all templates:

**Structure:**

```
┌─────────────────────────────┐
│       [University Logo]      │
│   Limkokwing University of   │
│   Creative Technology        │
├─────────────────────────────┤
│                             │
│   [Email Content - slot]    │
│                             │
├─────────────────────────────┤
│   © 2026 Limkokwing         │
│   University of Creative     │
│   Technology - Lesotho       │
│                             │
│   This is an automated email │
│   from the Registry Portal.  │
│   Do not reply to this email.│
└─────────────────────────────┘
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `previewText` | `string` | Email preview text (shown in inbox before opening) |
| `children` | `ReactNode` | Main email content |

**Design:**
- Background: `#f6f9fc` (light gray)
- Content area: white `#ffffff`, rounded corners
- Accent color: `#1a73e8` (blue — adjustable to university brand)
- Font: system font stack (Arial, Helvetica, sans-serif)
- Logo: hosted on R2 public URL (loaded via `getPublicUrl`)
- Footer: muted gray text, smaller font size
- Mobile responsive: max-width 600px, fluid padding

### 3. Student Status Email

**File:** `src/app/admin/mails/_templates/StudentStatusEmail.tsx`

Triggered when a student status is created, updated, approved, or rejected.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `studentName` | `string` | Student's full name |
| `stdNo` | `string` | Student number |
| `statusType` | `string` | Type of status request (e.g., "Deferment", "Withdrawal") |
| `action` | `'created' \| 'updated' \| 'approved' \| 'rejected'` | What happened |
| `reason` | `string` | Reason/comment (if applicable) |
| `approverName` | `string` | Name of approver (for approved/rejected) |
| `portalUrl` | `string` | Link to view in the portal |

**Content by action:**

| Action | Subject | Body |
|--------|---------|------|
| `created` | "New Status Request: {statusType}" | "{studentName} ({stdNo}) has submitted a {statusType} request." |
| `updated` | "Status Request Updated: {statusType}" | "{studentName} ({stdNo}) has updated their {statusType} request." |
| `approved` | "Status Request Approved: {statusType}" | "Your {statusType} request has been approved by {approverName}." |
| `rejected` | "Status Request Rejected: {statusType}" | "Your {statusType} request has been rejected by {approverName}. Reason: {reason}" |

Each includes a "View Details" button linking to `portalUrl`.

### 4. Notification Mirror Email

**File:** `src/app/admin/mails/_templates/NotificationEmail.tsx`

Mirrors in-app notifications to email.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Notification title |
| `message` | `string` | Notification body text |
| `link` | `string` | Optional action link |
| `senderName` | `string` | Who created the notification |

**Content:**
- Subject: `{title}`
- Body: `{message}` with an optional "View in Portal" button if `link` is provided.

### 5. Generic System Email

**File:** `src/app/admin/mails/_templates/GenericEmail.tsx`

Fallback template for miscellaneous system emails.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `heading` | `string` | Email heading |
| `body` | `string` | HTML content body |
| `ctaText` | `string` | Optional button text |
| `ctaUrl` | `string` | Optional button URL |

### 6. Render Utility

**File:** `src/app/admin/mails/_templates/render.ts`

Export render helper functions:

| Function | Description |
|----------|-------------|
| `renderStudentStatusEmail(props)` | Returns `{ html, text, subject }` |
| `renderNotificationEmail(props)` | Returns `{ html, text, subject }` |
| `renderGenericEmail(props)` | Returns `{ html, text, subject }` |

Each function:
1. Creates the React component with props.
2. Calls `render(component)` for HTML output.
3. Calls `render(component, { plainText: true })` for text fallback.
4. Returns both along with the generated subject line.

### 7. Template Preview (Development)

For development/testing, templates can be previewed by creating a simple Next.js API route:

**File:** `src/app/api/mail/preview/[template]/route.ts` (development only)

- Returns rendered HTML for a given template with sample data.
- Guard with `process.env.NODE_ENV === 'development'` check.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/_templates/BaseLayout.tsx` | Shared email layout |
| `src/app/admin/mails/_templates/StudentStatusEmail.tsx` | Student status notification |
| `src/app/admin/mails/_templates/NotificationEmail.tsx` | In-app notification mirror |
| `src/app/admin/mails/_templates/GenericEmail.tsx` | Generic system email |
| `src/app/admin/mails/_templates/render.ts` | Render helpers |
| `src/app/api/mail/preview/[template]/route.ts` | Dev-only preview route |

## Validation Criteria

1. `renderStudentStatusEmail()` returns valid HTML with all props rendered
2. `renderNotificationEmail()` returns valid HTML with notification content
3. `renderGenericEmail()` returns valid HTML with heading and body
4. All templates use the shared BaseLayout
5. Plain text fallback renders correctly (no HTML tags in text output)
6. Subject lines generated correctly per template
7. Preview route renders templates in development mode
8. All templates are dark-mode friendly in email clients (use explicit colors, not system colors)
9. `pnpm tsc --noEmit` passes
10. `pnpm lint:fix` passes

## Notes

- Email client CSS support is limited — use inline styles only (react-email handles this).
- Images in emails should be hosted on R2 CDN (not base64 embedded) for better deliverability.
- Keep emails under 102KB to avoid Gmail clipping.
- Test templates with tools like Litmus or Email on Acid for cross-client compatibility.
- The university logo should be uploaded to R2 storage and referenced via `getPublicUrl()`.
- `react-email` components don't use `'use client'` — they are pure React components rendered on the server. Ensure no client-side hooks are used in templates.
