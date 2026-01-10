'use client';

import { Badge, Group, Select } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
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
				<Select
					key='type-filter'
					size='xs'
					w={140}
					placeholder='Filter'
					value={typeFilter || 'all'}
					onChange={handleTypeChange}
					data={[
						{ value: 'all', label: 'All' },
						{ value: 'PastPaper', label: 'Past Paper' },
						{ value: 'ResearchPaper', label: 'Research Paper' },
						{ value: 'Thesis', label: 'Thesis' },
						{ value: 'Journal', label: 'Journal' },
						{ value: 'Other', label: 'Other' },
					]}
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
					description={resource.originalName}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
