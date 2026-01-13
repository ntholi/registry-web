'use client';

import { Group, Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { EntryRequirementWithRelations } from './_lib/types';
import { findAllEntryRequirements } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<EntryRequirementWithRelations>
			path='/admissions/entry-requirements'
			queryKey={['entry-requirements']}
			getData={findAllEntryRequirements}
			actionIcons={[
				<NewLink key='new-link' href='/admissions/entry-requirements/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={
						<Group gap='xs'>
							<Text size='sm' fw={500}>
								{item.program?.code}
							</Text>
							<Text size='xs' c='dimmed'>
								{item.certificateType?.name}
							</Text>
						</Group>
					}
					description={item.program?.name}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
