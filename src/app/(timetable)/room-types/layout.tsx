'use client';

import { findAllRoomTypes } from '@timetable/room-types/server';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/room-types'}
			queryKey={['room-types']}
			getData={findAllRoomTypes}
			actionIcons={[<NewLink key='new-link' href='/room-types/new' />]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
