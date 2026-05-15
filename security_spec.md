# Security Specification for ZenScan AI

## 1. Data Invariants
- A document must always belong to the authenticated user who created it (`userId` matches `request.auth.uid`).
- Users can only read or write their own profile and documents.
- Document IDs must be valid and strings.
- Timestamps must be validated using `request.time`.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a document with another user's `userId`.
2. **Unauthorized Read**: Attempt to read another user's document collection.
3. **Ghost Field Injection**: Attempt to add a hidden `isAdmin: true` field to a user document.
4. **ID Poisoning**: Attempt to create a document with a 2MB string as ID.
5. **PII Leakage**: Attempt to list all user profiles as an unauthenticated user.
6. **Immutable field update**: Attempt to change `createdAt` on an existing document.
7. **Type mismatch**: Send a number instead of a string for the document `name`.
8. **Size exceeding**: Send a 2MB string for the `category` field.
9. **Relational Sync bypass**: Attempt to list documents without being signed in.
10. **Self-Promotion**: User trying to update their own `uid` in the profile.
11. **Negative values**: Sending negative values for latitude/longitude (Wait, lat/long can be negative, but let's say extreme values outside -180/180).
12. **Null fields**: Sending null for a required field like `name`.

## 3. The Test Runner
A `firestore.rules.test.ts` would be used to verify these, but here I'll focus on the rules logic themselves.
