import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import EmployeeForm from '../../_components/Form';
import { getEmployee, updateEmployee } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: Props) {
	const { id } = await params;
	const employee = await getEmployee(id);

	if (!employee) return notFound();

	return (
		<Box p='lg'>
			<EmployeeForm
				title='Edit Employee'
				defaultValues={employee}
				onSubmit={async (values) => {
					'use server';
					return await updateEmployee(id, values);
				}}
			/>
		</Box>
	);
}
