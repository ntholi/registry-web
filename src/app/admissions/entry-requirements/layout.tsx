'use client';

import type { ProgramLevel } from '@academic/_database';
import { Badge, Group, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import EntryRequirementsFilter from './_components/EntryRequirementsFilter';
import type { EntryRequirementFilter, ProgramWithSchool } from './_lib/types';
import { findProgramsWithRequirements } from './_server/actions';

const levelColors: Record<ProgramLevel, string> = {
	certificate: 'gray',
	diploma: 'blue',
	degree: 'green',
};

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();

	const getData = async (page: number, search: string) => {
		const filter: EntryRequirementFilter = {};
		const schoolId = searchParams.get('schoolId');
		const level = searchParams.get('level');

		if (schoolId) filter.schoolId = Number(schoolId);
		if (level) filter.level = level as ProgramLevel;

		return findProgramsWithRequirements(
			page,
			search,
			Object.keys(filter).length > 0 ? filter : undefined
		);
	};

	return (
		<ListLayout<ProgramWithSchool>
			path='/admissions/entry-requirements'
			queryKey={['entry-requirements', searchParams.toString()]}
			getData={getData}
			actionIcons={[
				<EntryRequirementsFilter key='filter' />,
				<NewLink key='new-link' href='/admissions/entry-requirements/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={
						<Group gap='xs'>
							<Text size='sm' fw={500}>
								{item.code}
							</Text>
							<Badge size='xs' color={levelColors[item.level]}>
								{item.level}
							</Badge>
						</Group>
					}
					description={
						<Group gap='xs'>
							<Text size='xs' c='dimmed'>
								{item.name}
							</Text>
							<Text size='xs' c='dimmed'>
								• {item.school?.code}
							</Text>
						</Group>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
