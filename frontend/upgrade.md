# Next.js 15 Security Upgrade Guide
## CVE-2025-55182 (React2Shell) Mitigation

This guide will help you upgrade your Next.js application from version 14.x to 15.5.7 to address the critical security vulnerability CVE-2025-55182.

---

## Overview

**Critical Security Issue:** CVE-2025-55182 (React2Shell) affects React Server Components in Next.js versions prior to the patched releases.

**Target Versions:** One of the following patched versions:
- 15.0.5
- 15.1.9
- 15.2.6
- 15.3.6
- 15.4.8
- **15.5.7** (recommended)
- 16.0.7

**React Version Strategy:** This upgrade uses **React 19 with React 18 TypeScript types** for maximum compatibility with the current ecosystem.

---

## Prerequisites

Before starting:
1. Ensure you have a backup of your project
2. Commit all changes to git
3. Have at least Node.js 18.x installed
4. Review any custom Next.js plugins for compatibility

---

## Step 1: Backup Current Configuration

```bash
# Create backup of package.json
cp package.json package.json.backup

# Create backup of next.config.js
cp next.config.js next.config.js.backup
```

---

## Step 2: Update Dependencies in package.json

### 2.1 Update Next.js
Change:
```json
"next": "^14.0.0"
```
To:
```json
"next": "15.5.7"
```

### 2.2 Update React and React-DOM to 19.x
Change:
```json
"react": "^18.0.0",
"react-dom": "^18.0.0"
```
To:
```json
"react": "^19.0.0",
"react-dom": "^19.0.0"
```

### 2.3 **IMPORTANT:** Keep TypeScript Type Definitions at 18.x

**Keep React 18 types for compatibility:**
```json
"@types/react": "^18.3.0",
"@types/react-dom": "^18.3.0"
```

**Why?** React 19 types are incompatible with many UI libraries (Radix UI, etc.). Using React 18 types with React 19 runtime provides the best compatibility.

### 2.4 Update ESLint Config for Next.js
Change:
```json
"eslint-config-next": "^14.0.0"
```
To:
```json
"eslint-config-next": "15.5.7"
```

### 2.5 **CRITICAL:** Replace next-pwa (if using)

**Issue:** The `next-pwa` package is incompatible with Next.js 15.

**Solution:** Replace with `@ducanh2912/next-pwa`:

Remove:
```json
"next-pwa": "^5.6.0"
```

Add:
```json
"@ducanh2912/next-pwa": "^10.2.9"
```

---

## Step 3: Update next.config.js

### 3.1 Update PWA Configuration (if applicable)

**Old configuration:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
});
```

**New configuration:**
```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});
```

### 3.2 Add Experimental Settings (Optional, for Windows file locking issues)

If you encounter EPERM errors during build on Windows:

```javascript
const nextConfig = {
  experimental: {
    workerThreads: false,
  },
  // ... rest of your config
};
```

---

## Step 4: Fix Code Breaking Changes

### 4.1 Fix Dynamic Imports with ssr: false in Server Components

**Issue:** In Next.js 15, you cannot use `ssr: false` with `next/dynamic` in Server Components.

**Before:**
```typescript
// src/app/some-route/layout.tsx
import dynamic from 'next/dynamic';

const MyComponent = dynamic(() => import('./MyComponent'), {
  ssr: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MyComponent>{children}</MyComponent>;
}
```

**After:**
```typescript
// src/app/some-route/layout.tsx
'use client';

import dynamic from 'next/dynamic';

const MyComponent = dynamic(() => import('./MyComponent'), {
  ssr: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MyComponent>{children}</MyComponent>;
}
```

### 4.2 Update Layout Props for Next.js 15

**Issue:** Layouts must now accept a `params` prop (even if unused).

**Before:**
```typescript
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
```

**After:**
```typescript
export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Record<string, string | string[]>>;
}) {
  return <div>{children}</div>;
}
```

**Note:** The `params` parameter is required by Next.js 15 even if your layout doesn't use dynamic route params.

---

## Step 5: Install Dependencies

```bash
# Clean install
rm -rf node_modules

# Install dependencies
npm install

# If you encounter peer dependency warnings, use:
npm install --legacy-peer-deps
```

---

## Step 6: Verify Installation

```bash
# Check installed versions
npm list next react react-dom @types/react @types/react-dom --depth=0
```

You should see:
- `next@15.5.7`
- `react@19.x.x`
- `react-dom@19.x.x`
- `@types/react@18.3.x` (React 18 types are intentional!)
- `@types/react-dom@18.3.x`

---

## Step 7: Build for Production

```bash
npm run build
```

### Build Success Indicators

✅ `Compiled successfully`
✅ `Generating static pages (X/X)`
✅ `Finalizing page optimization`
✅ No TypeScript errors (thanks to React 18 types)

### If Build Fails with EPERM Errors (Windows)

**Issue:** File locking on `.next/trace` file

**Solution:**
1. Add experimental settings to next.config.js (see Step 3.2)
2. Manually remove the trace file:
   ```bash
   rm -f .next/trace
   npm run build
   ```

---

## Step 8: Test Deployment

### Local Testing
```bash
npm run build
npm start
```

### Vercel Deployment
✅ The build will now succeed on Vercel without needing `typescript.ignoreBuildErrors`
✅ All type checking passes
✅ Static pages generate successfully

---

## Final Configuration Summary

### package.json (Key Dependencies)
```json
{
  "dependencies": {
    "next": "15.5.7",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.7",
    "@ducanh2912/next-pwa": "^10.2.9",
    "eslint-config-next": "15.5.7"
  }
}
```

### next.config.js
```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  // Optional: Add if encountering file locking issues on Windows
  experimental: {
    workerThreads: false,
  },
  // ... your other config
};

module.exports = withPWA(nextConfig);
```

---

## Security Verification

After upgrade, verify the vulnerability is patched:

```bash
# Check for CVE-2025-55182 in audit
npm audit | grep -i "CVE-2025-55182"

# Should return no results if patched ✅
```

---

## Migration Checklist

- [ ] Backup package.json and next.config.js
- [ ] Update Next.js to 15.5.7
- [ ] Update React and React-DOM to 19.x
- [ ] **Keep** @types/react and @types/react-dom at 18.3.x
- [ ] Update eslint-config-next to 15.5.7
- [ ] Replace next-pwa with @ducanh2912/next-pwa (if applicable)
- [ ] Update next.config.js PWA configuration
- [ ] Fix dynamic imports in Server Components (add 'use client')
- [ ] Update layout props to include params
- [ ] Run `npm install`
- [ ] Run `npm run build` - should succeed ✅
- [ ] Verify security patch with `npm audit`
- [ ] Test locally with `npm start`
- [ ] Deploy to Vercel - build should succeed ✅

---

## Key Differences from Standard React 19 Upgrade

This upgrade strategy differs from a typical React 19 migration:

| Aspect | Standard React 19 | This Upgrade |
|--------|------------------|--------------|
| React Runtime | 19.x | ✅ 19.x |
| React Types | 19.x | ⚠️ **18.3.x** |
| TypeScript Errors | Many type conflicts | ✅ None |
| Vercel Build | May fail | ✅ Succeeds |
| UI Library Compat | Poor (Radix UI, etc.) | ✅ Excellent |

**Why this works:** React 19 is largely backward compatible at runtime. Using React 18 types prevents build-time type conflicts while still getting all React 19 runtime features and security patches.

---

## Troubleshooting

### Issue: npm keeps installing React 18 instead of 19

**Solution:** Check your package.json - npm may have auto-updated it. Manually set:
```json
"react": "^19.2.1",
"react-dom": "^19.2.1"
```
Then run: `npm install --legacy-peer-deps`

### Issue: Build fails with "Module not found: react"

**Solution:**
```bash
npm install react react-dom
npm run build
```

### Issue: EPERM errors on Windows

**Solution:**
1. Add to next.config.js:
   ```javascript
   experimental: {
     workerThreads: false,
   }
   ```
2. Remove lock: `rm -f .next/trace`

### Issue: Vercel deployment fails

**Symptom:** Build succeeds locally but fails on Vercel

**Check:**
- Ensure you're NOT using `typescript.ignoreBuildErrors: true`
- Verify React types are 18.3.x in package.json
- Check that all layout components have the `params` prop

---

## Rollback Plan

If the upgrade causes critical issues:

```bash
# Restore original package.json
cp package.json.backup package.json
cp next.config.js.backup next.config.js

# Reinstall dependencies
rm -rf node_modules .next
npm install

# Rebuild
npm run build
```

---

## Additional Resources

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [React 19 Security Advisory](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [CVE-2025-55182 Details](https://nextjs.org/blog/CVE-2025-66478)
- [@ducanh2912/next-pwa Documentation](https://ducanh-next-pwa.vercel.app/)

---

## Post-Upgrade Notes

### When to Migrate to React 19 Types

Once the ecosystem stabilizes (Radix UI, React Hook Form, etc. release React 19-compatible versions), you can upgrade to React 19 types:

```bash
npm install @types/react@^19.0.0 @types/react-dom@^19.0.0
```

Monitor these issues:
- [Radix UI React 19 Support](https://github.com/radix-ui/primitives/issues)
- [React Hook Form React 19](https://github.com/react-hook-form/react-hook-form/issues)

Until then, **the current setup (React 19 runtime + React 18 types) is production-ready and recommended**.

---

**Last Updated:** December 2025
**Version:** 2.0
**Target Next.js:** 15.5.7
**Strategy:** React 19 Runtime with React 18 Types for maximum compatibility
