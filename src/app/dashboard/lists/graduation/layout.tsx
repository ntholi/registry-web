'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getGraduationLists } from '@/server/lists/graduation/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/dashboard/lists/graduation'}
			queryKey={['graduation-lists']}
			getData={getGraduationLists}
			actionIcons={[<NewLink key={'new-link'} href="/dashboard/lists/graduation/new" />]}
			renderItem={(it) => <ListItem id={it.id} label={it.id} />}
		>
			{children}
		</ListLayout>
	);
}
