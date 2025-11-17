import { Box } from '@mantine/core';
import {
	createLecturerAllocationsWithVenueTypes,
	LecturerAllocationForm,
} from '@timetable/lecturer-allocations';

type Props = {
	searchParams: Promise<{ userId?: string; termId?: string }>;
};

export default async function NewPage({ searchParams }: Props) {
	const { userId, termId } = await searchParams;

	return (
		<Box p='lg'>
			<LecturerAllocationForm
				defaultValues={
					userId || termId
						? {
								userId: userId || '',
								termId: termId ? Number(termId) : 0,
								semesterModuleIds: [],
								venueTypeIds: [],
							}
						: undefined
				}
				onSubmit={async (values) => {
					'use server';
					const allocations = values.semesterModuleIds.map(
						(semesterModuleId) => ({
							userId: values.userId,
							termId: values.termId,
							semesterModuleId,
							duration: values.duration,
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
