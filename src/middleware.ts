import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Make home and Clerk auth pages public; everything else requires auth
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;

  // Public routes are accessible to everyone.
  // If the user is already signed in and tries to access the landing or auth pages,
  // redirect them straight to the dashboard.
  if (isPublicRoute(req)) {
    if (
      userId &&
      (url.pathname === '/' || url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))
    ) {
      return NextResponse.redirect(new URL('/dashboard', url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication.
  await auth.protect();
  return NextResponse.next();
});

// Apply middleware to all routes except Next.js internals and static assets
export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
};