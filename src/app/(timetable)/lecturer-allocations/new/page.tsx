import { Box } from '@mantine/core';
import {
	createLecturerAllocationsWithVenueTypes,
	LecturerAllocationForm,
} from '@timetable/lecturer-allocations';
import { config } from '@/config';

type Props = {
	searchParams: Promise<{ userId?: string; termId?: string }>;
};

export default async function NewPage({ searchParams }: Props) {
	const { userId, termId } = await searchParams;
	const defaults = config.timetable.lecturerAllocations;

	return (
		<Box p='lg'>
			<LecturerAllocationForm
				defaultValues={{
					userId: userId || '',
					termId: termId ? Number(termId) : 0,
					duration: defaults.duration,
					semesterModuleIds: [],
					venueTypeIds: [],
				}}
				onSubmit={async (values) => {
					'use server';
					const allocations = values.semesterModuleIds.map(
						(semesterModuleId) => ({
							userId: values.userId,
							termId: values.termId,
							semesterModuleId,
							duration: values.duration,
							allowedDays: defaults.allowedDays,
							startTime: defaults.startTime,
							endTime: defaults.endTime,
						})
					);
					await createLecturerAllocationsWithVenueTypes(
						allocations,
						values.venueTypeIds
					);
					return values;
				}}
			/>
		</Box>
	);
}
