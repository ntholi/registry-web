'use client';

import { IconCheck } from '@tabler/icons-react';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/components/adease';
import { findAllTerms } from '@/server/registry/terms/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/terms'}
			queryKey={['terms']}
			getData={findAllTerms}
			actionIcons={[<NewLink key={'new-link'} href='/terms/new' />]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.name}
					rightSection={
						it.isActive ? <IconCheck size={'1rem'} color='green' /> : null
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
