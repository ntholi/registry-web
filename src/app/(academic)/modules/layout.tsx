'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getModules } from '@/server/academic/modules/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/modules'}
			queryKey={['modules']}
			getData={getModules}
			actionIcons={[<NewLink key={'new-link'} href='/modules/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.code} description={it.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
