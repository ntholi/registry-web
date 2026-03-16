import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getAssessment, updateAssessment } from '../../_server/actions';

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
