import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { auth } from '@/auth';
import { DebugRibbon } from '@/components/DebugRibbon';
import { toTitleCase } from '@/lib/utils/utils';
import Dashboard from './dashboard';

export async function generateMetadata(): Promise<Metadata> {
	const session = await auth();
	return {
		title: `${toTitleCase(session?.user?.role)} Portal | Limkokwing`,
	};
}

export default function AdminLayout({ children }: PropsWithChildren) {
	return (
		<Dashboard>
			{!process.env.AUTH_URL?.includes('portal.co.ls') && <DebugRibbon />}
			{children}
		</Dashboard>
	);
}
