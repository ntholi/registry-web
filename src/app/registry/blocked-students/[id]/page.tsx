'use client';

import { Center, Loader, SimpleGrid, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import StudentStatusSwitch from '../_components/StudentStatusSwitch';
import { deleteBlockedStudent, getBlockedStudent } from '../_server/actions';

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
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						<FieldView label='Status' tt='capitalize'>
							{blockedStudent.status}
						</FieldView>
						<FieldView label='Department' tt='capitalize'>
							{blockedStudent.byDepartment}
						</FieldView>
					</SimpleGrid>
					<FieldView label='Date Blocked'>
						{formatDateTime(blockedStudent.createdAt, 'long')}
					</FieldView>
					<FieldView label='Reason'>{blockedStudent.reason}</FieldView>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
