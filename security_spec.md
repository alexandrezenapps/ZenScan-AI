# Security Specification for ZenScan

## Data Invariants
1. A user can only read and write their own profile document.
2. A document must belong to a valid user and can only be accessed by its owner.
3. Timestamps (`createdAt`, `updatedAt`) must be server-verified.
4. Document IDs must be valid strings.

## The "Dirty Dozen" Payloads (Deny cases)
1. Write to another user's profile.
2. Read another user's documents.
3. Create a document with another user's `userId`.
4. Update a document's `userId` (immutability).
5. Inject massive strings (>1MB) into `contentSnippet`.
6. Set `isAiEnhanced` without proper validation.
7. Use non-alphanumeric characters in document IDs.
8. Delete a user profile (unless admin).
9. Create a document with a future `createdAt` timestamp.
10. Update a terminal status (if applicable).
11. Query documents without filtering by `userId`.
12. Append fields not in the schema.

## Test Runner (Draft)
A `firestore.rules.test.ts` would verify these constraints using the Firebase Rules Emulator or similar.
