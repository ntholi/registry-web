'use client';

import { IconCheck } from '@tabler/icons-react';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllTerms } from '@/server/terms/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/dashboard/terms'}
			queryKey={['terms']}
			getData={findAllTerms}
			actionIcons={[<NewLink key={'new-link'} href="/dashboard/terms/new" />]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.name}
					rightSection={it.isActive ? <IconCheck size={'1rem'} color="green" /> : null}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
