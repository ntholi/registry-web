'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllUsers } from '@/server/users/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/dashboard/users'}
			queryKey={['users']}
			getData={findAllUsers}
			actionIcons={[<NewLink key={'new-link'} href="/dashboard/users/new" />]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} description={it.email} />}
		>
			{children}
		</ListLayout>
	);
}
