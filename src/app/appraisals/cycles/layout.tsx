'use client';

import { Badge } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import CycleStatusFilter from './_components/CycleStatusFilter';
import { getCycles } from './_server/actions';

function getCycleStatus(startDate: string, endDate: string) {
	const today = new Date().toISOString().slice(0, 10);
	if (today < startDate) return 'upcoming';
	if (today > endDate) return 'closed';
	return 'open';
}

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const status = searchParams.get('status') || 'all';

	return (
		<ListLayout
			path='/appraisals/cycles'
			queryKey={['feedback-cycles', searchParams.toString()]}
			getData={(page, search) =>
				getCycles(page, search, status !== 'all' ? status : undefined)
			}
			actionIcons={[
				<CycleStatusFilter key='status-filter' />,
				<NewLink
					key='new-link'
					href='/appraisals/cycles/new'
					resource='feedback-cycles'
				/>,
			]}
			renderItem={(it) => {
				const status = getCycleStatus(it.startDate, it.endDate);
				return (
					<ListItem
						id={it.id}
						label={it.name}
						description={it.schoolCodes.join(', ')}
						rightSection={
							<Badge size='sm' variant='light' color={getStatusColor(status)}>
								{status}
							</Badge>
						}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
