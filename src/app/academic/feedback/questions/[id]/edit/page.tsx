import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getQuestion, updateQuestion } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function QuestionEdit({ params }: Props) {
	const { id } = await params;
	const question = await getQuestion(Number(id));

	if (!question) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Question'
				defaultValues={question}
				onSubmit={async (value) => {
					'use server';
					return await updateQuestion(Number(id), value);
				}}
			/>
		</Box>
	);
}
