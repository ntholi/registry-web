import { Box } from '@mantine/core';
import { Form } from '@registry/registration/clearance';
import { getClearance, updateClearance } from '@registry/registration/server';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string; status: string }>;
};

export default async function ClearanceEdit({ params }: Props) {
	const { id, status } = await params;
	const clearance = await getClearance(Number(id));
	if (!clearance) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Clearance Task'}
				status={status as 'pending' | 'approved' | 'rejected'}
				defaultValues={clearance}
				onSubmit={async (value) => {
					'use server';
					return await updateClearance(Number(id), value);
				}}
			/>
		</Box>
	);
}
