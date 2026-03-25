import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	getLetterTemplate,
	updateLetterTemplate,
} from '../../../_server/actions';
import Form from '../../_components/Form';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditTemplatePage({ params }: Props) {
	const { id } = await params;
	const template = await getLetterTemplate(id);

	if (!template) return notFound();

	return (
		<Box p='lg'>
			<Form
				title='Edit Template'
				defaultValues={template}
				onSubmit={async (values) => {
					'use server';
					return updateLetterTemplate(id, values);
				}}
			/>
		</Box>
	);
}
