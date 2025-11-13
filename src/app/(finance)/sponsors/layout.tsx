'use client';

import type { PropsWithChildren } from 'react';
import { findAllSponsors } from '@/server/finance/sponsors/actions';
import { ListItem, ListLayout, NewLink } from '@/shared/components/adease';

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
