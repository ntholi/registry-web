import { Box } from '@mantine/core';
import {
	createLecturerAllocations,
	LecturerAllocationForm,
} from '@timetable/lecturer-allocations';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<LecturerAllocationForm
				onSubmit={async (values) => {
					'use server';
					const allocations = values.semesterModuleIds.map(
						(semesterModuleId) => ({
							userId: values.userId,
							termId: values.termId,
							semesterModuleId,
						})
					);
					await createLecturerAllocations(allocations);
				}}
			/>
		</Box>
	);
}
