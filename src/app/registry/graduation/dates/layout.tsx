'use client';

import { findAllGraduations } from '@registry/graduation/dates';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/registry/graduation/dates'}
			queryKey={['graduations']}
			getData={findAllGraduations}
			actionIcons={[
				<NewLink key={'new-link'} href='/registry/graduation/dates/new' />,
			]}
			renderItem={(it) => <ListItem id={it.date} label={it.date} />}
		>
			{children}
		</ListLayout>
	);
}
