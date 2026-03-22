import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import Dashboard from '@/app/dashboard/dashboard';
import withPermission, { getSession } from '@/core/platform/withPermission';
import { DebugRibbon } from '@/shared/ui/DebugRibbon';

export async function generateMetadata(): Promise<Metadata> {
	const session = await getSession();
	return {
		title: `${session?.user?.name ?? 'Profile'} | Limkokwing`,
	};
}

export default async function ProfileLayout({ children }: PropsWithChildren) {
	return withPermission(async (session) => {
		const isLocal = process.env.DATABASE_ENV === 'local';

		return (
			<Dashboard viewAs={session?.viewingAs ?? null}>
				{!process.env.BETTER_AUTH_URL?.includes('portal.co.ls') && (
					<DebugRibbon isLocal={isLocal} />
				)}
				{children}
			</Dashboard>
		);
	}, 'dashboard');
}
