import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import IntakePeriodForm from '../../_components/Form';
import {
	getIntakePeriod,
	getIntakePeriodProgramIds,
	setIntakePeriodProgramIds,
	updateIntakePeriod,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditIntakePeriodPage({ params }: Props) {
	const { id } = await params;
	const [item, programIds] = await Promise.all([
		getIntakePeriod(id),
		getIntakePeriodProgramIds(id),
	]);

	if (!item) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<IntakePeriodForm
				title='Edit Intake Period'
				defaultValues={{ ...item, programIds }}
				onSubmit={async (values) => {
					'use server';
					const { programIds: newProgramIds, ...data } = values;
					const result = await updateIntakePeriod(id, data);
					await setIntakePeriodProgramIds(id, newProgramIds ?? []);
					return result;
				}}
			/>
		</Box>
	);
}
