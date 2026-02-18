import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getPeriod, updatePeriod } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PeriodEdit({ params }: Props) {
	const { id } = await params;
	const period = await getPeriod(Number(id));

	if (!period) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Period'
				defaultValues={period}
				onSubmit={async (value) => {
					'use server';
					return await updatePeriod(Number(id), value);
				}}
			/>
		</Box>
	);
}
