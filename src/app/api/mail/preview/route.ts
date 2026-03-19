import { NextResponse } from 'next/server';

const templates = ['student-status', 'notification', 'generic'];

export async function GET() {
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json(
			{ error: 'Preview only available in development' },
			{ status: 403 }
		);
	}

	const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
	const links = templates
		.map((t) => `<li><a href="${base}/api/mail/preview/${t}">${t}</a></li>`)
		.join('\n');

	const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Email Previews</title>
<style>body{font-family:system-ui,sans-serif;max-width:480px;margin:4rem auto}
a{color:#228be6;text-decoration:none}a:hover{text-decoration:underline}
li{margin:.5rem 0}</style></head>
<body><h1>Email Template Previews</h1><ul>${links}</ul></body></html>`;

	return new NextResponse(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}
