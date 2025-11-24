import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { getModuleConfig } from '@/config/modules.config';
import { auth } from '@/core/auth';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { DebugRibbon } from '@/shared/ui/DebugRibbon';
import Dashboard from './dashboard';

export async function generateMetadata(): Promise<Metadata> {
	const session = await auth();
	return {
		title: `${toTitleCase(session?.user?.role)} Portal | Limkokwing`,
	};
}

export default function AdminLayout({ children }: PropsWithChildren) {
	const isLocal = process.env.DATABASE_ENV === 'local';
	const moduleConfig = getModuleConfig();

	return (
		<Dashboard moduleConfig={moduleConfig}>
			{!process.env.AUTH_URL?.includes('portal.co.ls') && (
				<DebugRibbon isLocal={isLocal} />
			)}
			{children}
		</Dashboard>
	);
}
