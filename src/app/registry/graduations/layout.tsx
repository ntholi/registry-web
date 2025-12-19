'use client';

import { findAllGraduations } from '@registry/graduations';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/registry/graduations'}
			queryKey={['graduations']}
			getData={findAllGraduations}
			actionIcons={[
				<NewLink key={'new-link'} href='/registry/graduations/new' />,
			]}
			renderItem={(it) => (
				<ListItem id={it.graduationDate} label={it.graduationDate} />
			)}
		>
			{children}
		</ListLayout>
	);
}
