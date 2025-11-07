'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllSponsors } from '@/server/sponsors/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/dashboard/sponsors'}
			queryKey={['sponsors']}
			getData={findAllSponsors}
			actionIcons={[
				<NewLink key={'new-link'} href='/dashboard/sponsors/new' />,
			]}
			renderItem={(it) => <ListItem id={it.id} label={it.code} description={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
