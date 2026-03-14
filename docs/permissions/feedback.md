# Student Feedback (Public) — Permission Map

## Navigation

No config — accessible via passphrase-based access (no dashboard login required).

---

## Feedback Service

**File:** `src/app/feedback/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `validatePassphrase()` | `'all'` |
| `getFeedbackData()` | `'all'` |
| `submitLecturerFeedback()` | `'all'` |
| `skipLecturer()` | `'all'` |
| `finalizeFeedback()` | `'all'` |

All methods are publicly accessible — authentication is handled via passphrase tokens, not session permissions.
