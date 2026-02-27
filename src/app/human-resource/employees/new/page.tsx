import { Box } from '@mantine/core';
import EmployeeForm from '../_components/Form';
import { createEmployee } from '../_server/actions';

export default function NewPage() {
	return (
		<Box p='lg'>
			<EmployeeForm title='New Employee' onSubmit={createEmployee} />
		</Box>
	);
}
