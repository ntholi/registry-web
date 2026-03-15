import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import Form from '../../_components/Form';
import {
	getCertificateReprint,
	updateCertificateReprint,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CertificateReprintEdit({ params }: Props) {
	const { id } = await params;
	const item = unwrap(await getCertificateReprint(id));
	if (!item) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Certificate Reprint'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return await updateCertificateReprint(id, value);
				}}
			/>
		</Box>
	);
}
