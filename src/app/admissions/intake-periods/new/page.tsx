import { Box } from '@mantine/core';
import IntakePeriodForm from '../_components/Form';
import { createIntakePeriod } from '../_server/actions';

export default function NewIntakePeriodPage() {
	return (
		<Box p={'lg'}>
			<IntakePeriodForm
				title='New Intake Period'
				onSubmit={createIntakePeriod}
			/>
		</Box>
	);
}
