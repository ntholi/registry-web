# Zoho Books Integration — Overview

This directory contains the integration documentation for connecting Registry Web to Zoho Books.

## Two Authentication Strategies

There are two approaches for authenticating with the Zoho Books API. Choose based on your needs:

### Option 1: [Self Client (Service Account)](./001_self-client-service-account.md)

A single shared Zoho account authenticates all API calls from Registry Web.

| Aspect | Details |
|---|---|
| **Complexity** | Low — one token in `.env`, no database table needed |
| **Setup time** | ~10 minutes |
| **User requirement** | Only the admin who generates the token needs a Zoho account |
| **Audit trail in Zoho** | All actions attributed to one service account |
| **Who did what?** | Cannot distinguish which finance user performed an action in Zoho's logs |
| **Best for** | Small teams, read-heavy usage, quick proof-of-concept |

### Option 2: [Per-User OAuth (Authorization Code Flow)](./002_per-user-oauth.md)

Each finance user connects their own Zoho account. API calls carry the user's identity.

| Aspect | Details |
|---|---|
| **Complexity** | Medium — requires callback route, `zoho_tokens` DB table, token encryption |
| **Setup time** | ~1–2 hours (app registration + code changes) |
| **User requirement** | Every finance user needs a Zoho Books account in the organization |
| **Audit trail in Zoho** | Each action attributed to the actual user who performed it |
| **Who did what?** | Full accountability — Zoho's native audit trail shows the real user |
| **Best for** | Production use, compliance, multi-user teams, accountability |

## Shared Configuration

Both options share the same:

- **Zoho Books organization** (LSL currency, reporting tags, custom fields)
- **`zoho-config.json`** (tag/field ID mappings, generated via script)
- **Business logic** (contact mapping, tag resolution, API endpoints)
- **UI components** (StudentFinanceView, InvoicesTab, etc.)

The only difference is **how tokens are obtained and stored**.

## Recommendation

For production, **Option 2 (Per-User OAuth)** is strongly recommended. Zoho Books has excellent built-in audit logging that tracks who created/modified every entity. Using a service account throws away this audit trail.

Option 1 remains useful for development/testing or if only one person manages Zoho operations.

---

## Quick Reference: Shared Resources

| Resource | Location |
|---|---|
| Zoho HTTP client | `src/app/finance/_lib/zoho-books/client.ts` |
| Business logic (contacts, transactions) | `src/app/finance/_lib/zoho-books/service.ts` |
| Server Actions | `src/app/finance/_lib/zoho-books/actions.ts` |
| TypeScript types | `src/app/finance/_lib/zoho-books/types.ts` |
| Tag/field config | `src/app/finance/_lib/zoho-books/zoho-config.json` |
| Config generator script | `scripts/fetch-zoho-config.ts` |
| Finance UI components | `src/app/registry/students/_components/finance/` |
