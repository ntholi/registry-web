import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getAssessment, updateAssessment } from '@/server/assessments/actions';
import Form from '../../Form';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function AssessmentEdit({ params }: Props) {
	const { id } = await params;
	const assessment = await getAssessment(Number(id));
	if (!assessment) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Assessment'}
				defaultValues={assessment}
				onSubmit={async (value) => {
					'use server';
					return await updateAssessment(Number(id), value);
				}}
			/>
		</Box>
	);
}
