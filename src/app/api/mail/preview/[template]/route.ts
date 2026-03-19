import { type NextRequest, NextResponse } from 'next/server';
import {
	renderGenericEmail,
	renderNotificationEmail,
	renderStudentStatusEmail,
} from '@/app/admin/mails/_templates/render';

const sampleData = {
	'student-status': {
		studentName: 'Jane Doe',
		stdNo: '901234567',
		statusType: 'Deferment',
		action: 'created' as const,
		reason: 'Medical reasons',
		approverName: 'Dr. Smith',
		portalUrl: 'http://localhost:3000/registry/student-statuses/1',
	},
	notification: {
		title: 'New Assignment Posted',
		message:
			'A new assignment has been posted for Introduction to Programming (CS101). The deadline is March 30, 2026.',
		link: 'http://localhost:3000/dashboard',
		senderName: 'Academic Office',
	},
	generic: {
		heading: 'Important Notice',
		body: 'This is a <strong>sample</strong> generic email with HTML content for testing purposes.',
		ctaText: 'Visit Portal',
		ctaUrl: 'http://localhost:3000',
	},
};

type Params = { template: string };

const renderers: Record<
	string,
	() => Promise<{ html: string; text: string; subject: string }>
> = {
	'student-status': () =>
		renderStudentStatusEmail(sampleData['student-status']),
	notification: () => renderNotificationEmail(sampleData.notification),
	generic: () => renderGenericEmail(sampleData.generic),
};

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<Params> }
) {
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json(
			{ error: 'Preview only available in development' },
			{ status: 403 }
		);
	}

	const { template } = await params;
	const renderer = renderers[template];

	if (!renderer) {
		return NextResponse.json(
			{
				error: `Unknown template: ${template}`,
				available: Object.keys(renderers),
			},
			{ status: 404 }
		);
	}

	const result = await renderer();
	return new NextResponse(result.html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}
