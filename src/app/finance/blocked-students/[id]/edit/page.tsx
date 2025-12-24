import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getBlockedStudent, updateBlockedStudent } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BlockedStudentEdit({ params }: Props) {
	const { id } = await params;
	const blockedStudent = await getBlockedStudent(Number(id));
	if (!blockedStudent) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Blocked Student'}
				defaultValues={blockedStudent}
				onSubmit={async (value) => {
					'use server';
					return await updateBlockedStudent(Number(id), value);
				}}
			/>
		</Box>
	);
}
