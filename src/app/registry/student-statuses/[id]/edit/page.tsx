import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getStudentStatus, updateStudentStatus } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function StudentStatusEditPage({ params }: Props) {
	const { id } = await params;
	const item = await getStudentStatus(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Application'
				mode='edit'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return updateStudentStatus(Number(id), {
						termCode: value.termCode,
						justification: value.justification,
						notes: value.notes,
					});
				}}
			/>
		</Box>
	);
}
