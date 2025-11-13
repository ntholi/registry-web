'use client';

import type { PropsWithChildren } from 'react';
import { getModules } from '@/modules/academic/features/modules/server/actions';
import { ListItem, ListLayout, NewLink } from '@/shared/components/adease';

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
