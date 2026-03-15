import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import Form from '../../_components/Form';
import { getApplicant, updateApplicant } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ApplicantEdit({ params }: Props) {
	const { id } = await params;
	const item = unwrap(await getApplicant(id));

	if (!item) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Applicant'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return unwrap(await updateApplicant(id, value));
				}}
			/>
		</Box>
	);
}
