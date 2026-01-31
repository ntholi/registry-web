'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { RecognizedSchool } from './_lib/types';
import { findAllRecognizedSchools } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<RecognizedSchool>
			path='/admissions/recognized-schools'
			queryKey={['recognized-schools']}
			getData={findAllRecognizedSchools}
			actionIcons={[
				<NewLink key='new-link' href='/admissions/recognized-schools/new' />,
			]}
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
