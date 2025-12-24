'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getModules } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/academic/modules'}
			queryKey={['modules']}
			getData={getModules}
			actionIcons={[<NewLink key={'new-link'} href='/academic/modules/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.code} description={it.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
