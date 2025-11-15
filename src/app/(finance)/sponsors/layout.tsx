'use client';

import { findAllSponsors } from '@finance/sponsors';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/sponsors'}
			queryKey={['sponsors']}
			getData={findAllSponsors}
			actionIcons={[<NewLink key={'new-link'} href='/sponsors/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.code} description={it.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
