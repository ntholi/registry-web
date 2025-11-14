import { Box } from '@mantine/core';
import { Form } from '@registry/graduation';
import {
	getGraduationRequest,
	updateGraduationRequest,
} from '@registry/graduation/clearance';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function GraduationRequestEdit({ params }: Props) {
	const { id } = await params;
	const graduationRequest = await getGraduationRequest(Number(id));
	if (!graduationRequest) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Graduation Request'}
				defaultValues={graduationRequest}
				onSubmit={async (value) => {
					'use server';
					return await updateGraduationRequest(Number(id), value);
				}}
			/>
		</Box>
	);
}
