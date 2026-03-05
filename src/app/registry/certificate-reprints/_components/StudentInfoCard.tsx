'use client';

import { Card, Flex, Group, Skeleton, Stack, Text } from '@mantine/core';
import EditStudentModal from '@registry/students/_components/info/EditStudentModal';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getPublishedAcademicHistory } from '@/app/registry/students/_server/actions';

type Props = {
	stdNo: number | null;
	editable?: boolean;
	onGraduationDateChange?: (hasGraduationDate: boolean) => void;
};

export default function StudentInfoCard({
	stdNo,
	editable = true,
	onGraduationDateChange,
}: Props) {
	const isValid = stdNo !== null && String(stdNo).length === 9;

	const { data: student, isLoading } = useQuery({
		queryKey: ['student', stdNo, 'published'],
		queryFn: () => getPublishedAcademicHistory(stdNo!),
		enabled: isValid,
	});

	const completedProgram = student?.programs?.find(
		(p) => p?.status === 'Completed'
	);

	const hasGraduationDate = !!completedProgram?.graduationDate;

	useEffect(() => {
		if (!isLoading) {
			onGraduationDateChange?.(isValid ? hasGraduationDate : true);
		}
	}, [hasGraduationDate, isValid, isLoading, onGraduationDateChange]);

	return (
		<Card withBorder>
			{isLoading ? (
				<Stack gap={6}>
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} height={16} width={`${60 + i * 5}%`} />
					))}
				</Stack>
			) : (
				<Stack gap={4}>
					<Flex justify='space-between'>
						<InfoRow label='Name' value={student?.name} />
						{editable && student && <EditStudentModal student={student} />}
					</Flex>
					<InfoRow label='Phone 1' value={student?.phone1} />
					<InfoRow label='Phone 2' value={student?.phone2} />
					<InfoRow
						label='Graduation Date'
						value={completedProgram?.graduationDate}
					/>
				</Stack>
			)}
		</Card>
	);
}

type InfoRowProps = {
	label: string;
	value: string | null | undefined;
};

function InfoRow({ label, value }: InfoRowProps) {
	return (
		<Group gap='xs'>
			<Text size='sm' c='dimmed' w={120}>
				{label}:
			</Text>
			<Text size='sm' fw={500}>
				{value || 'N/A'}
			</Text>
		</Group>
	);
}
