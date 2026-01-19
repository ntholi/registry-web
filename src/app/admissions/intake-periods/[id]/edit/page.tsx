import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import IntakePeriodForm from '../../_components/Form';
import { getIntakePeriod, updateIntakePeriod } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditIntakePeriodPage({ params }: Props) {
	const { id } = await params;
	const item = await getIntakePeriod(id);

	if (!item) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<IntakePeriodForm
				title='Edit Intake Period'
				defaultValues={item}
				onSubmit={async (values) => {
					'use server';
					return updateIntakePeriod(id, values);
				}}
			/>
		</Box>
	);
}
