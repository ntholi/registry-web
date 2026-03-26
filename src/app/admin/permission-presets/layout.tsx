'use client';

import { findAllPresets } from '@auth/permission-presets/_server/actions';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import PresetRoleFilter from './_components/PresetRoleFilter';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const role = searchParams.get('role') || 'all';

	return (
		<ListLayout
			path={'/admin/permission-presets'}
			queryKey={['permission-presets', searchParams.toString()]}
			getData={(page, search) =>
				findAllPresets(page, search, role !== 'all' ? role : undefined)
			}
			actionIcons={[
				<PresetRoleFilter key='role-filter' />,
				<NewLink
					key={'new-link'}
					href='/admin/permission-presets/new'
					resource='permission-presets'
				/>,
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
