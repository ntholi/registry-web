'use client';

import {
	type ClearanceFilter,
	clearanceByStatus,
} from '@registry/registration/requests';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import {
	type ClearanceFilter as AtomClearanceFilter,
	clearanceFilterAtom,
} from '@/shared/ui/atoms/clearanceFilterAtoms';
import RegistrationClearanceFilter from '@/shared/ui/RegistrationClearanceFilter';

type Status = 'pending' | 'approved' | 'rejected' | 'all';

type ClearanceItem = {
	id: number;
	status: 'pending' | 'approved' | 'rejected';
	registrationRequest: {
		student: {
			stdNo: number;
			name: string;
		};
	} | null;
};

function getFilterKey(filter: AtomClearanceFilter) {
	return JSON.stringify(filter);
}

export default function Layout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter = (searchParams.get('status') || 'pending') as Status;
	const [filter, setFilter] = useAtom(clearanceFilterAtom);

	const apiFilter: ClearanceFilter = {
		termId: filter.termId,
		schoolId: filter.schoolId,
		programId: filter.programId,
		programLevel: filter.programLevel,
		semester: filter.semester,
	};

	function handleStatusChange(status: string) {
		const params = new URLSearchParams(searchParams);
		if (status !== 'pending') {
			params.set('status', status);
		} else {
			params.delete('status');
		}
		params.delete('page');
		const query = params.toString();
		router.push(
			query
				? `/registry/registration/clearance?${query}`
				: '/registry/registration/clearance'
		);
	}

	return (
		<ListLayout<ClearanceItem>
			path='/registry/registration/clearance'
			queryKey={['clearances', statusFilter, getFilterKey(filter)]}
			getData={async (page, search) => {
				const effectiveStatus =
					search && statusFilter !== 'all'
						? undefined
						: statusFilter === 'all'
							? undefined
							: statusFilter;
				const response = await clearanceByStatus(
					effectiveStatus,
					page,
					search,
					apiFilter
				);
				return {
					items: response.items || [],
					totalPages: response.totalPages || 1,
					totalItems: response.totalItems ?? 0,
				};
			}}
			actionIcons={[
				<RegistrationClearanceFilter
					key='clearance-filter'
					statusValue={statusFilter}
					onFilterChange={setFilter}
					onStatusChange={handleStatusChange}
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.registrationRequest?.student.stdNo || 'N/A'}
					description={it.registrationRequest?.student.name || 'Unknown'}
					rightSection={getStatusIcon(it.status)}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}

function getStatusIcon(status: 'pending' | 'approved' | 'rejected') {
	const color = getStatusColor(status);
	switch (status) {
		case 'pending':
			return <IconClock size={'1rem'} color={color} />;
		case 'approved':
			return <IconCheck size={'1rem'} color={color} />;
		case 'rejected':
			return <IconAlertCircle size={'1rem'} color={color} />;
	}
}
