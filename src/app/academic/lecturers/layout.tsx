'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import LecturerSchoolFilter from './_components/LecturerSchoolFilter';
import { getLecturers } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const schoolId = searchParams.get('schoolId') || undefined;

	return (
		<ListLayout
			path={'/academic/lecturers'}
			queryKey={['lecturers', searchParams.toString()]}
			getData={async (page, search) => getLecturers(page, search, schoolId)}
			actionIcons={[<LecturerSchoolFilter key='filter' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.name} description={it.email} />
			)}
		>
			{children}
		</ListLayout>
	);
}
