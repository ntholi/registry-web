'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ModulesFilter from './_components/ModulesFilter';
import { getModules } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const schoolId = searchParams.get('schoolId') || undefined;
	const status = searchParams.get('status') || undefined;

	return (
		<ListLayout
			path={'/academic/modules'}
			queryKey={['modules', searchParams.toString()]}
			getData={async (page, search) =>
				getModules(page, search, schoolId, status)
			}
			actionIcons={[
				<ModulesFilter key='filter' />,
				<NewLink
					key={'new-link'}
					href='/academic/modules/new'
					resource='modules'
				/>,
			]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.code} description={it.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
