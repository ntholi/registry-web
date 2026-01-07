'use client';

import { findAllGraduations } from '@registry/dates/graduations';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/registry/dates/graduations'}
			queryKey={['graduations']}
			getData={findAllGraduations}
			actionIcons={[
				<NewLink key={'new-link'} href='/registry/dates/graduations/new' />,
			]}
			renderItem={(it) => <ListItem id={it.date} label={it.date} />}
		>
			{children}
		</ListLayout>
	);
}
