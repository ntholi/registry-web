'use client';

import { findAllPresets } from '@auth/permission-presets/_server/actions';
import { Badge, Group, Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/admin/permission-presets'}
			queryKey={['permission-presets']}
			getData={findAllPresets}
			actionIcons={[
				<NewLink key={'new-link'} href='/admin/permission-presets/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.name}
					description={toTitleCase(it.role)}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
