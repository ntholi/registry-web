'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllVenueTypes } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/timetable/venue-types'
			queryKey={['venue-types']}
			getData={findAllVenueTypes}
			actionIcons={[
				<NewLink key='new-link' href='/timetable/venue-types/new' />,
			]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
