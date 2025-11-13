'use client';

import { IconCheck } from '@tabler/icons-react';
import type { PropsWithChildren } from 'react';
import { findAllTerms } from '@/modules/registry/features/terms/server/actions';
import { ListItem, ListLayout, NewLink } from '@/shared/components/adease';

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
