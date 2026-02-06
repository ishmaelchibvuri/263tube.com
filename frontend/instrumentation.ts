// instrumentation.ts - Server-side instrumentation for Next.js

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Server-side instrumentation registered');
  }
}
