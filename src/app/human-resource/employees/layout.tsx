'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import EmployeesFilter from './_components/EmployeesFilter';
import type { Employee } from './_lib/types';
import { findAllEmployees } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const department = searchParams.get('department') || undefined;
	const status = searchParams.get('status') || undefined;

	return (
		<ListLayout<Employee>
			path='/human-resource/employees'
			queryKey={['employees', searchParams.toString()]}
			getData={async (page, search) =>
				findAllEmployees(page, search, department, status)
			}
			actionIcons={[
				<EmployeesFilter key='filter' />,
				<NewLink
					key='new-link'
					href='/human-resource/employees/new'
					resource='employees'
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.empNo}
					label={it.title ? `${it.title} ${it.name}` : it.name}
					description={it.empNo}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
