import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import EmployeeTabs from '../_components/EmployeeTabs';
import { deleteEmployee, getEmployee } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const employee = await getEmployee(id);
	const name = employee?.title
		? `${employee.title} ${employee.name}`
		: employee?.name;
	return {
		title: `${name} | Limkokwing`,
	};
}

export default async function EmployeeDetailPage({ params }: Props) {
	const { id } = await params;
	const employee = await getEmployee(id);

	if (!employee) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title={
					employee.title ? `${employee.title} ${employee.name}` : employee.name
				}
				queryKey={['employees']}
				handleDelete={async () => {
					'use server';
					await deleteEmployee(employee.empNo);
				}}
			/>
			<EmployeeTabs employee={employee} />
		</DetailsView>
	);
}
