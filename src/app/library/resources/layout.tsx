'use client';

import { Badge, Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ResourceTypeFilter from './_components/ResourceTypeFilter';
import type { ResourceType, ResourceWithRelations } from './_lib/types';
import { getResources } from './_server/actions';

export default function ResourcesLayout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const typeFilter = (searchParams.get('type') as ResourceType) || undefined;

	async function fetchResources(page: number, search: string) {
		return getResources(page, search, typeFilter);
	}

	function handleTypeChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'all') {
			params.set('type', value);
		} else {
			params.delete('type');
		}
		params.delete('page');
		router.push(`/library/resources?${params.toString()}`);
	}

	return (
		<ListLayout<ResourceWithRelations>
			path='/library/resources'
			queryKey={['resources', typeFilter || 'all']}
			getData={fetchResources}
			actionIcons={[
				<ResourceTypeFilter
					key='type-filter'
					value={typeFilter || 'all'}
					onChange={handleTypeChange}
				/>,
				<NewLink key='new' href='/library/resources/new' />,
			]}
			renderItem={(resource) => (
				<ListItem
					id={resource.id}
					label={
						<Group gap='xs'>
							{resource.title}
							<Badge size='xs' variant='light'>
								{toTitleCase(resource.type)}
							</Badge>
						</Group>
					}
					description={resource.document?.fileName}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
