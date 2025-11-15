import { Badge } from '@mantine/core';
import {
	deleteLecturerAllocation,
	getLecturerAllocation,
} from '@timetable/lecturer-allocations';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function LecturerAllocationDetails({ params }: Props) {
	const { id } = await params;
	const allocation = await getLecturerAllocation(Number(id));

	if (!allocation) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Lecturer Allocation'
				queryKey={['lecturer-allocations']}
				handleDelete={async () => {
					'use server';
					await deleteLecturerAllocation(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Lecturer'>
					{allocation.user?.name || 'Unknown'}
					{allocation.user?.email && (
						<Badge variant='light' ml='xs'>
							{allocation.user.email}
						</Badge>
					)}
				</FieldView>
				<FieldView label='Term'>{allocation.term?.name || 'Unknown'}</FieldView>
				<FieldView label='Module'>
					{allocation.semesterModule?.module?.code || 'Unknown'} -{' '}
					{allocation.semesterModule?.module?.name || 'Unknown'}
				</FieldView>
				<FieldView label='Program'>
					{allocation.semesterModule?.semester?.structure?.program?.name ||
						'Unknown'}
				</FieldView>
				<FieldView label='Semester'>
					{allocation.semesterModule?.semester?.name || 'Unknown'}
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
