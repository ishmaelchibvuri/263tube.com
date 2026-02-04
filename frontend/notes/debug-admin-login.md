# Admin Login Debug Guide

## Problem
Administrator user (ishmaelchibvuri@gmail.com) is being redirected to normal user dashboard instead of admin dashboard.

## Debug Steps

### 1. Check Browser Console Output
1. Open Developer Tools (F12)
2. Go to Console tab
3. Clear console
4. Log in as ishmaelchibvuri@gmail.com
5. Look for "PROFILE DEBUG" output

Expected output:
```
========== PROFILE DEBUG ==========
Full profile object: { "role": "admin", ... }
profile.role: admin
profile.isAdmin: undefined or true
profile.role === 'admin': true
===================================
```

If `profile.role` is NOT "admin", the backend is returning the wrong role.

### 2. Check Backend Database
Query your database to verify the user's role:
```sql
SELECT userId, email, role, firstName, lastName
FROM users
WHERE email = 'ishmaelchibvuri@gmail.com';
```

The `role` column MUST be exactly `"admin"` (not "administrator", "Admin", or anything else).

### 3. Fix Backend Data
If the role is wrong in the database:
```sql
UPDATE users
SET role = 'admin'
WHERE email = 'ishmaelchibvuri@gmail.com';
```

### 4. Verify Backend API
Check that your backend `/auth/profile` endpoint:
- Fetches the user's role from the database
- Returns it in the response as `role: "admin"`
- Does NOT transform or change the role value

### 5. Clear Local Storage & Cookies
Sometimes cached auth data causes issues:
1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Clear:
   - Local Storage
   - Session Storage
   - Cookies for your domain
4. Refresh the page
5. Log in again

## Key Files Reference

| File | Purpose | Line |
|------|---------|------|
| `src/app/(auth)/login/page.tsx` | Login redirect logic | 119-132 |
| `src/lib/api-client.ts` | Profile API call | 312 |
| `src/types/index.ts` | User schema (role must be 'admin') | 8 |
| `src/components/admin/AdminLayout.tsx` | Admin access gate | 42-67 |

## Valid Role Values
According to `src/types/index.ts:8`, role must be one of:
- `'user'`
- `'student'`
- `'admin'` ← Required for admin access

## Contact Backend Team
If the issue persists, ask your backend team to verify:
1. Is ishmaelchibvuri@gmail.com marked as admin in the database?
2. Does the `/auth/profile` API endpoint return the correct role?
3. Are there any middleware or transformations that modify the role value?
