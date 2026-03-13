import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/auth/login'] as const;

function isPublicPath(pathname: string) {
	if (PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number])) {
		return true;
	}

	return pathname.startsWith('/api/auth');
}

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	if (isPublicPath(pathname)) {
		return NextResponse.next();
	}

	const sessionCookie = getSessionCookie(request);
	if (sessionCookie) {
		return NextResponse.next();
	}

	const loginUrl = new URL('/auth/login', request.url);
	loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: [
		'/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
	],
};
