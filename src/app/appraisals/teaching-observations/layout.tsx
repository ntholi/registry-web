'use client';

import { Badge } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import type { AllStatusType } from '@/shared/lib/utils/colors';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getObservations } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/appraisals/teaching-observations'
			queryKey={['teaching-observations']}
			getData={getObservations}
			actionIcons={[
				<NewLink
					key='new-link'
					href='/appraisals/teaching-observations/new'
					resource='teaching-observations'
				/>,
			]}
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
