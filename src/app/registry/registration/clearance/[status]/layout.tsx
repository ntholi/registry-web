'use client';

import {
	type ClearanceFilter,
	clearanceByStatus,
} from '@registry/registration/requests';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import {
	type ClearanceFilter as AtomClearanceFilter,
	clearanceFilterAtom,
} from '@/shared/ui/atoms/clearanceFilterAtoms';
import RegistrationClearanceFilter from '@/shared/ui/RegistrationClearanceFilter';

type Status = 'pending' | 'approved' | 'rejected';

type ClearanceItem = {
	id: number;
	status: Status;
	registrationRequest: {
		student: {
			stdNo: number;
			name: string;
		};
	} | null;
};

const statusTitles = {
	pending: 'Pending Clearance Requests',
	approved: 'Approved Clearances',
	rejected: 'Rejected Clearances',
};

function getFilterKey(filter: AtomClearanceFilter) {
	return JSON.stringify(filter);
}

export default function Layout({ children }: PropsWithChildren) {
	const params = useParams();
	const status = params.status as Status;
	const [filter, setFilter] = useAtom(clearanceFilterAtom);

	if (!statusTitles[status]) {
		return <div>Invalid status: {status}</div>;
	}

	const apiFilter: ClearanceFilter = {
		termId: filter.termId,
		schoolId: filter.schoolId,
		programId: filter.programId,
		programLevel: filter.programLevel,
		semester: filter.semester,
	};

	return (
		<ListLayout
			path={`/registry/registration/clearance/${status}`}
			queryKey={['clearances', status, getFilterKey(filter)]}
			getData={async (page, search) => {
				const response = await clearanceByStatus(
					status,
					page,
					search,
					apiFilter
				);
				return {
					items: response.items || [],
					totalPages: response.totalPages || 1,
				};
			}}
			actionIcons={[
				<RegistrationClearanceFilter
					key='clearance-filter'
					onFilterChange={setFilter}
				/>,
			]}
			renderItem={(it: ClearanceItem) => (
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
