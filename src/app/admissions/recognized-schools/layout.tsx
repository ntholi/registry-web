'use client';

import { Badge, Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import RecognizedSchoolActiveFilter from './_components/RecognizedSchoolActiveFilter';
import type { RecognizedSchool } from './_lib/types';
import { findAllRecognizedSchools } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const active = searchParams.get('active') || 'all';

	return (
		<ListLayout<RecognizedSchool>
			path='/admissions/recognized-schools'
			queryKey={['recognized-schools', searchParams.toString()]}
			getData={(page, search) =>
				findAllRecognizedSchools(
					page,
					search,
					active !== 'all' ? active : undefined
				)
			}
			actionIcons={[
				<RecognizedSchoolActiveFilter key='active-filter' />,
				<NewLink
					key='new-link'
					href='/admissions/recognized-schools/new'
					resource='recognized-schools'
				/>,
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
