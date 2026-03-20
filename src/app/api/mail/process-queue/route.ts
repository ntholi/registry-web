import { processEmailQueue } from '@mail/queues/_server/queue-processor';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: Request) {
	const authHeader = request.headers.get('authorization');
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const result = await processEmailQueue();
	return NextResponse.json(result);
}
