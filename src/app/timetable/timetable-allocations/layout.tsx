'use client';

import { getLecturers } from '@academic/lecturers';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import AddSlotAllocationWithLecturerModal from './_components/AddSlotAllocationWithLecturerModal';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/timetable/timetable-allocations'}
			queryKey={['timetable-allocations']}
			getData={getLecturers}
			actionIcons={[<AddSlotAllocationWithLecturerModal key='add-slot' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.name} description={it.email} />
			)}
		>
			{children}
		</ListLayout>
	);
}
