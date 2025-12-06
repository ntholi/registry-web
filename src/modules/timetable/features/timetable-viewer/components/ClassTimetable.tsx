'use client';

import { Center, Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import TimetableGrid from '@/modules/timetable/shared/components/TimetableGrid';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	getClassesWithTimetable,
	getClassTimetableSlots,
} from '../server/actions';

type Props = {
	termId: number;
};

export default function ClassTimetable({ termId }: Props) {
	const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

	const { data: classes = [] } = useQuery({
		queryKey: ['classes-for-term', termId],
		queryFn: () => getClassesWithTimetable(termId),
		enabled: !!termId,
	});

	const { data: slots = [], isLoading } = useQuery({
		queryKey: ['class-timetable', selectedClassId, termId],
		queryFn: () => getClassTimetableSlots(selectedClassId!, termId),
		enabled: !!selectedClassId,
	});

	const classOptions = classes.map((cls) => ({
		value: cls.semesterId.toString(),
		label: `${cls.programCode} - ${formatSemester(cls.semesterNumber, 'short')}`,
	}));

	return (
		<Stack gap='md'>
			<Select
				label='Class'
				placeholder='Search for a class'
				searchable
				data={classOptions}
				value={selectedClassId ? selectedClassId.toString() : null}
				onChange={(value) => setSelectedClassId(value ? Number(value) : null)}
				clearable
				w={400}
			/>

			{!selectedClassId ? (
				<Center h={400}>
					<Text c='dimmed'>Select a class to view its timetable</Text>
				</Center>
			) : (
				<TimetableGrid
					slots={slots}
					isLoading={isLoading}
					emptyMessage='No timetable found for this class.'
					showVenue
					showClass={false}
					showLecturer
				/>
			)}
		</Stack>
	);
}
