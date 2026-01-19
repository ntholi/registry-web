import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import {
	getCertificateType,
	updateCertificateType,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CertificateTypeEdit({ params }: Props) {
	const { id } = await params;
	const item = await getCertificateType(id);

	if (!item) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Certificate Type'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return await updateCertificateType(id, value);
				}}
			/>
		</Box>
	);
}
