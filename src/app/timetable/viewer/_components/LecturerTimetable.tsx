'use client';

import { getLecturers } from '@academic/lecturers';
import { Center, Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import TimetableGrid from '@/modules/timetable/shared/components/TimetableGrid';
import { getLecturerTimetableSlots } from '../_server/actions';

type Props = {
	termId: number;
};

export default function LecturerTimetable({ termId }: Props) {
	const [selectedLecturerId, setSelectedLecturerId] = useState<string | null>(
		null
	);

	const { data: lecturersData } = useQuery({
		queryKey: ['lecturers-select'],
		queryFn: () => getLecturers(1, ''),
	});

	const lecturers = lecturersData?.items ?? [];

	const { data: slots = [], isLoading } = useQuery({
		queryKey: ['lecturer-timetable', selectedLecturerId, termId],
		queryFn: () => getLecturerTimetableSlots(selectedLecturerId!, termId),
		enabled: !!selectedLecturerId,
	});

	return (
		<Stack gap='md'>
			<Select
				label='Lecturer'
				placeholder='Search for a lecturer'
				searchable
				data={lecturers.map((lecturer) => ({
					value: lecturer.id,
					label: lecturer.name ?? lecturer.email ?? 'Unknown',
				}))}
				value={selectedLecturerId}
				onChange={setSelectedLecturerId}
				clearable
				w={400}
			/>

			{!selectedLecturerId ? (
				<Center h={400}>
					<Text c='dimmed'>Select a lecturer to view their timetable</Text>
				</Center>
			) : (
				<TimetableGrid
					slots={slots}
					isLoading={isLoading}
					emptyMessage='No timetable found for this lecturer.'
					showVenue
					showClass
					showLecturer={false}
				/>
			)}
		</Stack>
	);
}
