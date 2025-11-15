import { Form } from '@finance/sponsors';
import { getSponsor, updateSponsor } from '@finance/sponsors/server';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SponsorEdit({ params }: Props) {
	const { id } = await params;
	const sponsor = await getSponsor(Number(id));
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
					return await updateSponsor(Number(id), value);
				}}
			/>
		</Box>
	);
}
