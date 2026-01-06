'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllVenues } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/timetable/venues'}
			queryKey={['venues']}
			getData={findAllVenues}
			actionIcons={[<NewLink key='new-link' href='/timetable/venues/new' />]}
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
