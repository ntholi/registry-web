'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
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
				<NewLink key='new-link' href='/registry/student-statuses/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={
						<Group gap='xs'>
							{it.stdNo}
							<Badge
								size='xs'
								color={getStatusColor(it.status as AllStatusType)}
								variant='light'
							>
								{it.status}
							</Badge>
						</Group>
					}
					description={
						<Group gap='xs'>
							{it.student?.name}
							<Badge size='xs' variant='outline'>
								{getTypeLabel(it.type)}
							</Badge>
						</Group>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
