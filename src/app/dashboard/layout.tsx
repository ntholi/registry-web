import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { getSession } from '@/core/platform/withPermission';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { DebugRibbon } from '@/shared/ui/DebugRibbon';
import Dashboard from './dashboard';

export async function generateMetadata(): Promise<Metadata> {
	const session = await getSession();
	return {
		title: `${toTitleCase(session?.user?.role)} Portal | Limkokwing`,
	};
}

export default async function AdminLayout({ children }: PropsWithChildren) {
	const isLocal = process.env.DATABASE_ENV === 'local';
	const session = await getSession();

	return (
		<Dashboard viewAs={session?.viewingAs ?? null}>
			{!process.env.BETTER_AUTH_URL?.includes('portal.co.ls') && (
				<DebugRibbon isLocal={isLocal} />
			)}
			{children}
		</Dashboard>
	);
}
