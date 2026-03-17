import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getCycle, updateCycle } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CycleEdit({ params }: Props) {
	const { id } = await params;
	const cycle = await getCycle(id);

	if (!cycle) {
		return notFound();
	}

	const schoolIds =
		'cycleSchools' in cycle
			? (cycle.cycleSchools as { schoolId: number }[]).map((cs) => cs.schoolId)
			: [];

	return (
		<Box p='lg'>
			<Form
				title='Edit Feedback Cycle'
				defaultValues={{ ...cycle, schoolIds }}
				onSubmit={async (value) => {
					'use server';
					return await updateCycle(id, value);
				}}
			/>
		</Box>
	);
}
