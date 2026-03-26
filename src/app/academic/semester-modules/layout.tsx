'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import SemesterModulesFilter from './_components/SemesterModulesFilter';
import { findAllModules } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const schoolId = searchParams.get('schoolId') || undefined;
	const programId = searchParams.get('programId') || undefined;

	return (
		<ListLayout
			path={'/academic/semester-modules'}
			queryKey={['semester-modules', searchParams.toString()]}
			getData={async (page, search) =>
				findAllModules(page, search, schoolId, programId)
			}
			actionIcons={[
				<SemesterModulesFilter key='filter' />,
				<NewLink
					key={'new-link'}
					href='/academic/semester-modules/new'
					resource='semester-modules'
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.module?.code || ''}
					description={it.module?.name || ''}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
