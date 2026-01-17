'use client';

import type { ProgramLevel } from '@academic/_database';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import EntryRequirementsFilter from './_components/EntryRequirementsFilter';
import type { EntryRequirementFilter, ProgramWithSchool } from './_lib/types';
import { findProgramsWithRequirements } from './_server/actions';

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
				<ListItem id={item.id} label={item.code} description={item.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
