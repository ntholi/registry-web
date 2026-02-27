'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { Employee } from './_lib/types';
import { findAllEmployees } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<Employee>
			path='/human-resource/employees'
			queryKey={['employees']}
			getData={findAllEmployees}
			actionIcons={[
				<NewLink key='new-link' href='/human-resource/employees/new' />,
			]}
			renderItem={(it) => (
				<ListItem id={it.empNo} label={it.name} description={it.empNo} />
			)}
		>
			{children}
		</ListLayout>
	);
}
