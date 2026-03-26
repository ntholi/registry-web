'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { getStatusIcon, type StatusType } from '@/shared/lib/utils/status';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getTypeLabel } from './_lib/labels';
import { findAllStudentStatuses } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/registry/student-statuses'
			queryKey={['student-statuses']}
			getData={(page, search) => findAllStudentStatuses(page, search)}
			actionIcons={[
				<NewLink
					key='new-link'
					href='/registry/student-statuses/new'
					resource='student-statuses'
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.student?.name}
					description={
						<Group gap='xs'>
							{it.student?.stdNo}
							<Badge
								size='xs'
								radius={'sm'}
								variant='light'
								color={getColorType(it.type)}
							>
								{getTypeLabel(it.type)}
							</Badge>
						</Group>
					}
					rightSection={getStatusIcon(it.status as StatusType, {
						withColor: true,
					})}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}

function getColorType(type: string) {
	switch (type) {
		case 'withdrawal':
			return 'red';
		case 'deferment':
			return 'yellow';
		case 'reinstatement':
			return 'green';
		default:
			return 'gray';
	}
}
