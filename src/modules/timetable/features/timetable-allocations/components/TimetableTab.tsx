'use client';

import { Center, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getUserTimetableSlots } from '@timetable/slots/server/actions';
import TimetableGrid from '@/modules/timetable/shared/components/TimetableGrid';

type Props = {
	userId: string;
	selectedTermId: number | null;
};

export default function TimetableTab({ userId, selectedTermId }: Props) {
	const { data: slots = [], isLoading } = useQuery({
		queryKey: ['timetable-slots', userId, selectedTermId],
		queryFn: () => getUserTimetableSlots(userId, selectedTermId!),
		enabled: !!selectedTermId,
	});

	if (!selectedTermId) {
		return (
			<Center h={400}>
				<Text c='dimmed'>Please select a term to view the timetable</Text>
			</Center>
		);
	}

	return (
		<TimetableGrid
			slots={slots}
			isLoading={isLoading}
			emptyMessage='No timetable slots found. Create allocations and generate the timetable first.'
			showVenue
			showClass
			showLecturer={false}
		/>
	);
}
