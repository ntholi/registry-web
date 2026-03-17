'use client';

import { Badge } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { hasAnyPermission } from '@/core/auth/sessionPermissions';
import { authClient } from '@/core/auth-client';
import type { AllStatusType } from '@/shared/lib/utils/colors';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getObservations } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const { data: session } = authClient.useSession();
	const canCreate =
		session?.user?.role === 'admin' ||
		hasAnyPermission(session, 'teaching-observations', [
			'create',
			'update',
			'delete',
		]);

	return (
		<ListLayout
			path='/appraisals/teaching-observations'
			queryKey={['teaching-observations']}
			getData={getObservations}
			actionIcons={
				canCreate
					? [
							<NewLink
								key='new-link'
								href='/appraisals/teaching-observations/new'
							/>,
						]
					: []
			}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.lecturerName}
					description={`${it.moduleCode} — ${it.moduleName}`}
					rightSection={
						<Badge
							size='sm'
							variant='light'
							color={getStatusColor(it.status as AllStatusType)}
						>
							{it.status}
						</Badge>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
