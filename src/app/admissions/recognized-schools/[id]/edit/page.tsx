import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import {
	getRecognizedSchool,
	updateRecognizedSchool,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function RecognizedSchoolEdit({ params }: Props) {
	const { id } = await params;
	const item = await getRecognizedSchool(Number(id));
	if (!item) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Recognized School'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return await updateRecognizedSchool(Number(id), value);
				}}
			/>
		</Box>
	);
}
