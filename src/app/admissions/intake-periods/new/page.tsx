import { Box } from '@mantine/core';
import { formatMonthYear } from '@/shared/lib/utils/dates';
import IntakePeriodForm from '../_components/Form';
import {
	createIntakePeriod,
	setIntakePeriodProgramIds,
} from '../_server/actions';

export default function NewIntakePeriodPage() {
	return (
		<Box p={'lg'}>
			<IntakePeriodForm
				title='New Intake Period'
				onSubmit={async (values) => {
					'use server';
					const { programIds, ...data } = values;
					const result = await createIntakePeriod(data);
					if (programIds && programIds.length > 0) {
						await setIntakePeriodProgramIds(result.id, programIds);
					}
					return result;
				}}
				defaultValues={{
					name: formatMonthYear(new Date(), 'long'),
				}}
			/>
		</Box>
	);
}
