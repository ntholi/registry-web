import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getCycle, updateCycle } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CycleEdit({ params }: Props) {
	const { id } = await params;
	const cycle = await getCycle(Number(id));

	if (!cycle) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Feedback Cycle'
				defaultValues={cycle}
				onSubmit={async (value) => {
					'use server';
					return await updateCycle(Number(id), value);
				}}
			/>
		</Box>
	);
}
