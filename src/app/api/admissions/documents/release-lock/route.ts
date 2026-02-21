import { releaseReviewLock } from '@admissions/documents/_server/actions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const { documentId } = await request.json();

	if (!documentId || typeof documentId !== 'string') {
		return NextResponse.json({ error: 'Invalid documentId' }, { status: 400 });
	}

	await releaseReviewLock(documentId);
	return NextResponse.json({ ok: true });
}
