import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getBlockedStudent, updateBlockedStudent } from '@/server/blocked-students/actions';
import Form from '../../Form';

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
