'use server';

import { auth } from '@/core/auth';
import {
	getConnectedEmail,
	hasGmailScope,
} from '@/core/integrations/google-gmail';

export async function checkGmailConnection(): Promise<{
	connected: boolean;
	email?: string;
}> {
	const session = await auth();
	if (!session?.user?.id) {
		return { connected: false };
	}

	const connected = await hasGmailScope(session.user.id);
	if (!connected) {
		return { connected: false };
	}

	try {
		const email = await getConnectedEmail(session.user.id);
		return { connected: true, email: email ?? undefined };
	} catch {
		return { connected: false };
	}
}
