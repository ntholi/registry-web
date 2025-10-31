'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/components/adease';
import { findAllStudents, type StudentFilter } from '@/server/students/actions';
import StudentsFilter from './StudentsFilter';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();

	const getStudentsData = async (page: number, search: string) => {
		const filter: StudentFilter = {};

		const schoolId = searchParams.get('schoolId');
		const programId = searchParams.get('programId');
		const termId = searchParams.get('termId');
		const semesterNumber = searchParams.get('semesterNumber');

		if (schoolId) filter.schoolId = Number(schoolId);
		if (programId) filter.programId = Number(programId);
		if (termId) filter.termId = Number(termId);
		if (semesterNumber) filter.semesterNumber = Number(semesterNumber);

		return findAllStudents(page, search, Object.keys(filter).length > 0 ? filter : undefined);
	};

	return (
		<ListLayout
			path={'/dashboard/students'}
			queryKey={['students', searchParams.toString()]}
			getData={getStudentsData}
			actionIcons={[<StudentsFilter key={'filter-link'} />]}
			renderItem={(it) => <ListItem id={it.stdNo} label={it.name} description={it.stdNo} />}
		>
			{children}
		</ListLayout>
	);
}
