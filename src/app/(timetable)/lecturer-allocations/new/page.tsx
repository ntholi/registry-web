import { Box } from '@mantine/core';
import {
	createLecturerAllocations,
	LecturerAllocationForm,
} from '@timetable/lecturer-allocations';

type Props = {
	searchParams: Promise<{ userId?: string }>;
};

export default async function NewPage({ searchParams }: Props) {
	const { userId } = await searchParams;

	return (
		<Box p='lg'>
			<LecturerAllocationForm
				defaultValues={
					userId
						? {
								userId,
								termId: 0,
								semesterModuleIds: [],
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
						})
					);
					await createLecturerAllocations(allocations);
				}}
			/>
		</Box>
	);
}
