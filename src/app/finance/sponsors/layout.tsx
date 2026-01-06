'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllSponsors } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/finance/sponsors'}
			queryKey={['sponsors']}
			getData={findAllSponsors}
			actionIcons={[<NewLink key={'new-link'} href='/finance/sponsors/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.code} description={it.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
