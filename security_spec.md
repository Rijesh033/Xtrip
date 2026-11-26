# XTRIP Security Specification

## 1. Data Invariants
1. **Profile Isolation**: A `profiles/{userId}` document contains PII (`email`, `fullName`) and may only be read, created, updated, or deleted by the authenticated owner whose `request.auth.uid == userId`. Blanket listing of `profiles` is strictly prohibited (`allow list: if false;`).
2. **Trip Ownership**: Every `trips/{tripId}` document must have `userId == request.auth.uid`, valid `YYYY-MM-DD` date strings where `endDate >= startDate`, non-negative bounded `budget`, and a valid allowlisted currency code.
3. **Relational Sync (Expenses, Places, Memories)**: An expense, place, or memory cannot exist without a valid `tripId` whose parent `/trips/{tripId}` document exists and is owned by `request.auth.uid`. `tripId` and `userId` are immutable after creation.
4. **Media Vault Ownership**: Uploaded image documents in `media/{mediaId}` are strictly owned by `userId == request.auth.uid`, constrained to image data URLs (`^data:image/(webp|jpeg|png);base64,`) under 750,000 bytes to prevent resource exhaustion.
5. **Temporal & Structural Integrity**: `createdAt` is immutable (`== request.time` on create), `updatedAt == request.time` on create/update, all string sizes are bounded, and shadow fields are rejected via `hasAll` + `hasOnly` and `affectedKeys().hasOnly(...)`.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Trip Read**: Anonymous client attempts `get /trips/trip1` -> Denied by `isSignedIn()`.
2. **Cross-User Profile Read**: User B attempts `get /profiles/userA` -> Denied by `userId == request.auth.uid`.
3. **Profile Enumeration**: Authenticated user attempts `list /profiles` -> Denied by `allow list: if false`.
4. **Identity Spoofing on Trip Create**: User A attempts `create /trips/t1` with `userId: "userB"` -> Denied by `data.userId == request.auth.uid`.
5. **Orphaned Expense Creation**: User A attempts `create /expenses/e1` with `tripId: "nonexistent"` -> Denied by `exists(/databases/.../trips/nonexistent)`.
6. **Cross-Tenant Expense Injection**: User B attempts `create /expenses/e2` referencing `tripId` owned by User A -> Denied by `get(.../trips/tripId).data.userId == request.auth.uid`.
7. **Shadow Field Injection on Trip Update**: User A attempts `update /trips/t1` adding `isAdmin: true` -> Denied by `affectedKeys().hasOnly(...)` and `isValidTrip()`.
8. **Negative Expense Amount**: User A attempts `create /expenses/e3` with `amount: -500` -> Denied by `data.amount > 0`.
9. **Invalid Date Inversion**: User A attempts `create /trips/t2` with `startDate: "2026-12-10"`, `endDate: "2026-12-01"` -> Denied by `data.endDate >= data.startDate`.
10. **Immutable Ownership Tampering**: User A attempts `update /trips/t1` changing `userId` or `createdAt` -> Denied by immutability guards.
11. **Oversized ID Poisoning**: User A attempts `create /trips/<200-char-id>` -> Denied by `isValidId(tripId)`.
12. **Blanket Collection Query Without Owner Filter**: User A attempts `list /trips` without `where('userId', '==', uid)` -> Denied by `resource.data.userId == request.auth.uid` on `allow list`.
