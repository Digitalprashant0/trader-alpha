# Security Specification - Trading Alpha

## Data Invariants
- A trade must belong to the user who created it (`userId` check).
- A trade's `netPnL` cannot be modified by the user unless it matches the calculated result of `grossPnL - charges` (checked on write).
- Symbols must be uppercase and within 128 chars.
- Timestamps must be valid Firestore timestamps.

## Dirty Dozen Payloads (Rejection Tests)
1. Unauthorized profile read (UID mismatch).
2. Unauthorized trade creation in another user's collection.
3. Trade with negative quantity.
4. Trade with missing symbol.
5. Large payload (DOS attack) on symbol field (>1MB string).
6. Modification of `createdAt` timestamp.
7. Deletion of another user's trade.
8. Update of trade `type` to an invalid value (e.g. "HOLD").
9. Setting `isAdmin` flag on user profile (Privilege escalation).
10. Anonymous user attempting to write data (if restricted).
11. PII exposure in public fields.
12. Orphaned trade record without a valid user ID.
