'use client';

import { findAllUsers } from '@admin/users/server';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/users'}
			queryKey={['users']}
			getData={findAllUsers}
			actionIcons={[<NewLink key={'new-link'} href='/users/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.name} description={it.email} />
			)}
		>
			{children}
		</ListLayout>
	);
}
