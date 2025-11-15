import { Box } from '@mantine/core';
import { getLecturerAllocation } from '@timetable/lecturer-allocations';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function LecturerAllocationEdit({ params }: Props) {
	const { id } = await params;
	const allocation = await getLecturerAllocation(Number(id));

	if (!allocation) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<div>
				Edit functionality is not available for individual allocations. Please
				delete this allocation and create a new one if needed.
			</div>
		</Box>
	);
}
