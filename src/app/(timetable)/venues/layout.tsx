'use client';

import { findAllVenues } from '@timetable/venues';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/venues'}
			queryKey={['venues']}
			getData={findAllVenues}
			actionIcons={[<NewLink key='new-link' href='/venues/new' />]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.name}
					description={`${it.type.name} (${it.capacity})`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
