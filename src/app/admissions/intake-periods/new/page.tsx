import { Box } from '@mantine/core';
import { formatMonthYear } from '@/shared/lib/utils/dates';
import IntakePeriodForm from '../_components/Form';
import { createIntakePeriod } from '../_server/actions';

export default function NewIntakePeriodPage() {
	return (
		<Box p={'lg'}>
			<IntakePeriodForm
				title='New Intake Period'
				onSubmit={createIntakePeriod}
				defaultValues={{
					name: formatMonthYear(new Date(), 'long'),
				}}
			/>
		</Box>
	);
}
