'use client';

import { Badge, Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import SubjectsFilter from './_components/SubjectsFilter';
import type { Subject } from './_lib/types';
import { findAllSubjects } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();

	const getData = async (page: number, search: string) => {
		const lqfLevelParam = searchParams.get('lqfLevel');
		const lqfLevel =
			lqfLevelParam === 'null'
				? null
				: lqfLevelParam
					? Number(lqfLevelParam)
					: 4;
		return findAllSubjects(page, search, lqfLevel);
	};

	return (
		<ListLayout<Subject>
			path='/admissions/subjects'
			queryKey={['subjects', searchParams.toString()]}
			getData={getData}
			actionIcons={[
				<SubjectsFilter key='filter' />,
				<NewLink key='new-link' href='/admissions/subjects/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={
						<Group gap='xs'>
							{item.name}
							{!item.isActive && (
								<Badge size='xs' color='gray' variant='light'>
									Inactive
								</Badge>
							)}
						</Group>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
