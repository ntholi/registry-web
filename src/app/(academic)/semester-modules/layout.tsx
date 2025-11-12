'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllModules } from '@/server/academic/semester-modules/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/semester-modules'}
			queryKey={['semester-modules']}
			getData={findAllModules}
			actionIcons={[<NewLink key={'new-link'} href='/semester-modules/new' />]}
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
