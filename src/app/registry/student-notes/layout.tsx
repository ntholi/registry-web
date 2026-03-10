'use client';

import { Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllNotes } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/registry/student-notes'
			queryKey={['student-notes']}
			getData={(page, search) => findAllNotes(page, search)}
			actionIcons={[
				<NewLink key='new-link' href='/registry/student-notes/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.stdNo}
					description={
						<Text size='xs' lineClamp={1}>
							{it.studentName}
						</Text>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
