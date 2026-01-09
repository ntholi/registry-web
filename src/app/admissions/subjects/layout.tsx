'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { Subject } from './_lib/types';
import { findAllSubjects } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<Subject>
			path='/admissions/subjects'
			queryKey={['subjects']}
			getData={findAllSubjects}
			actionIcons={[<NewLink key='new-link' href='/admissions/subjects/new' />]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={
						<Group gap='xs'>
							{item.name}
							{!item.isActive && (
								<Badge size='xs' color='gray' variant='light'>
									Inactive
								</Badge>
							)}
						</Group>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
