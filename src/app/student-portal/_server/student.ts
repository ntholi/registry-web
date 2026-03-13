'use server';

import { getStdNoByUserId } from '@registry/students/_server/actions';
import { forbidden, unauthorized } from 'next/navigation';
import { getSession } from '@/core/platform/withPermission';

export async function requireCurrentStudent(): Promise<number> {
	const session = await getSession();
	if (!session?.user?.id) return unauthorized();
	const stdNo = await getStdNoByUserId(session.user.id);
	if (!stdNo) return forbidden();
	return stdNo;
}
