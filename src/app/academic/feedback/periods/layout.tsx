'use client';

import { Badge, Group, Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getPeriods } from './_server/actions';

function getPeriodStatus(startDate: string, endDate: string) {
	const today = new Date().toISOString().slice(0, 10);
	if (today < startDate) return 'upcoming';
	if (today > endDate) return 'closed';
	return 'open';
}

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/academic/feedback/periods'
			queryKey={['feedback-periods']}
			getData={getPeriods}
			actionIcons={[
				<NewLink key='new-link' href='/academic/feedback/periods/new' />,
			]}
			renderItem={(it) => {
				const status = getPeriodStatus(it.startDate, it.endDate);
				return (
					<ListItem
						id={it.id}
						label={
							<Group gap='xs' wrap='nowrap'>
								<Text size='sm' truncate>
									{it.name}
								</Text>
								<Badge size='xs' variant='light' color={getStatusColor(status)}>
									{status}
								</Badge>
							</Group>
						}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
