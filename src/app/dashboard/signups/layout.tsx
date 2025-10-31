'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllSignups } from '@/server/signups/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/dashboard/signups'}
			queryKey={['signups']}
			getData={findAllSignups}
			actionIcons={[<NewLink key={'new-link'} href="/dashboard/signups/new" />]}
			renderItem={(it) => <ListItem id={it.userId} label={it.stdNo} />}
		>
			{children}
		</ListLayout>
	);
}
