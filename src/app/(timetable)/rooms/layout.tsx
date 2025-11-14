'use client';

import { findAllRooms } from '@timetable/rooms';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/rooms'}
			queryKey={['rooms']}
			getData={findAllRooms}
			actionIcons={[<NewLink key='new-link' href='/rooms/new' />]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
