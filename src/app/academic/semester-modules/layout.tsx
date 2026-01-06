'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllModules } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/academic/semester-modules'}
			queryKey={['semester-modules']}
			getData={findAllModules}
			actionIcons={[
				<NewLink key={'new-link'} href='/academic/semester-modules/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.module?.code || ''}
					description={it.module?.name || ''}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
