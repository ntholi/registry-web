'use client';

import { StudentStatusSwitch } from '@finance/blocked-students';
import { Center, Loader, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import {
	deleteBlockedStudent,
	getBlockedStudent,
} from '@/modules/finance/features/blocked-students/server/actions';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';

export default function BlockedStudentDetails() {
	const params = useParams();
	const id = Number(params.id);

	const {
		data: blockedStudent,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['blocked-student', id],
		queryFn: () => getBlockedStudent(id),
		enabled: !!id,
	});

	if (isLoading) {
		return (
			<Center h={'60vh'}>
				<Loader />
			</Center>
		);
	}

	if (error || !blockedStudent) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={blockedStudent.student.name}
				queryKey={['blocked-students']}
				editRoles={['finance']}
				handleDelete={async () => {
					await deleteBlockedStudent(id);
				}}
			/>
			<DetailsViewBody>
				<Stack gap='lg'>
					<StudentStatusSwitch
						id={blockedStudent.id}
						currentStatus={blockedStudent.status}
						stdNo={blockedStudent.stdNo}
						studentName={blockedStudent.student.name}
					/>

					<FieldView label='Std No'>{blockedStudent.stdNo}</FieldView>
					<FieldView label='Status'>{blockedStudent.status}</FieldView>
					<FieldView label='Reason'>{blockedStudent.reason}</FieldView>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
