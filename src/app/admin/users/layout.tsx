'use client';

import { findAllUsers } from '@admin/users';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/admin/users'}
			queryKey={['users']}
			getData={findAllUsers}
			actionIcons={[<NewLink key={'new-link'} href='/admin/users/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.name} description={it.email} />
			)}
		>
			{children}
		</ListLayout>
	);
}
