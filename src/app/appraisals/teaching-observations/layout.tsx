'use client';

import { Badge } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import type { AllStatusType } from '@/shared/lib/utils/colors';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ObservationStatusFilter from './_components/ObservationStatusFilter';
import { getObservations } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const status = searchParams.get('status') || 'all';

	return (
		<ListLayout
			path='/appraisals/teaching-observations'
			queryKey={['teaching-observations', searchParams.toString()]}
			getData={(page, search) =>
				getObservations(page, search, status !== 'all' ? status : undefined)
			}
			actionIcons={[
				<ObservationStatusFilter key='status-filter' />,
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
