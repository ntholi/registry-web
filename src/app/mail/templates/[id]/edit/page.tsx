import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getMailTemplate, updateMailTemplate } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditMailTemplatePage({ params }: Props) {
	const { id } = await params;
	const template = await getMailTemplate(id);

	if (!template) return notFound();

	return (
		<Box p='lg'>
			<Form
				title='Edit Mail Template'
				defaultValues={template}
				onSubmit={async (values) => {
					'use server';
					return updateMailTemplate(id, values);
				}}
			/>
		</Box>
	);
}
