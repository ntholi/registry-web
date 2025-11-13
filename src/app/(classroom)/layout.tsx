import { Alert } from '@mantine/core';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { DebugRibbon } from '@/shared/ui/DebugRibbon';
import Dashboard from '../dashboard/dashboard';

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Classroom | Limkokwing`,
	};
}

export default function AdminLayout({ children }: PropsWithChildren) {
	const isLocal = process.env.DATABASE_ENV === 'local';
	return (
		<Dashboard>
			{!process.env.AUTH_URL?.includes('portal.co.ls') && (
				<DebugRibbon isLocal={isLocal} />
			)}
			<Alert title='Notice' color='yellow' m='lg' mt={'sm'}>
				Google Classroom integration is currently under development. Some
				features may not function as expected.
			</Alert>
			{children}
		</Dashboard>
	);
}
