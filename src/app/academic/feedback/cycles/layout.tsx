'use client';

import { Badge } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getCycles } from './_server/actions';

function getCycleStatus(startDate: string, endDate: string) {
	const today = new Date().toISOString().slice(0, 10);
	if (today < startDate) return 'upcoming';
	if (today > endDate) return 'closed';
	return 'open';
}

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/academic/feedback/cycles'
			queryKey={['feedback-cycles']}
			getData={getCycles}
			actionIcons={[
				<NewLink key='new-link' href='/academic/feedback/cycles/new' />,
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
