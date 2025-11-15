import { Box } from '@mantine/core';
import { Form } from '@registry/students';
import { getStudent, updateStudent } from '@registry/students/server';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function StudentEdit({ params }: Props) {
	const { id } = await params;
	const student = await getStudent(Number(id));
	if (!student) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Student'}
				defaultValues={student}
				onSubmit={async (value) => {
					'use server';
					return await updateStudent(Number(id), value);
				}}
			/>
		</Box>
	);
}
