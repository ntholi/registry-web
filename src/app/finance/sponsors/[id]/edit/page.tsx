import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import Form from '../../_components/Form';
import { getSponsor, updateSponsor } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SponsorEdit({ params }: Props) {
	const { id } = await params;
	const sponsor = unwrap(await getSponsor(Number(id)));
	if (!sponsor) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Sponsor'}
				defaultValues={sponsor}
				onSubmit={async (value) => {
					'use server';
					return unwrap(await updateSponsor(Number(id), value));
				}}
			/>
		</Box>
	);
}
