# Security Specification - ZenScan

## 1. Data Invariants
- A user document must correspond to the authenticated user's UID.
- A document record must belong to a valid user and carry that user's UID as `userId`.
- Timestamps (`createdAt`, `updatedAt`) must be server-generated.
- Core Identity fields (`uid` for users, `userId` for documents) are immutable after creation.
- Document types are restricted to standard scan formats.

## 2. The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Theft**: Creating a user profile with another user's UID.
2. **PII Leak**: Reading another user's profile information.
3. **Ghost Fields**: Adding unauthorized administrative fields like `isAdmin: true` to a profile.
4. **Timestamp Spoofing**: Sending client-side timestamps for `createdAt`.
5. **ID Poisoning**: Using a 2KB string as a document ID.
6. **Orphaned Writes**: Creating a document for a user that doesn't exist.
7. **Type Mismatch**: Sending a string where a boolean (`isAiEnhanced`) is expected.
8. **Privilege Escalation**: Updating the `uid` of an existing user document.
9. **Identity Spoofing**: Setting `userId` of a document record to someone else.
10. **Query Scraping**: Listing all user documents without filtering by `userId`.
11. **Malicious Tags**: Injecting 1000 tags into a document.
12. **Shadow Edit**: Modifying a document's `userId` to transfer ownership.

## 3. Test Runner
Verification is performed via `DRAFT_firestore.rules` validation logic.
