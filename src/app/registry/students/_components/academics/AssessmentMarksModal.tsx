'use client';

import { getAssessmentMarksByStudentModuleId } from '@academic/assessment-marks';
import {
	Box,
	Group,
	Modal,
	Progress,
	Skeleton,
	Stack,
	Table,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentTypeLabel } from '@/app/academic/assessments';

type Props = {
	studentModuleId: number;
	moduleCode: string;
	moduleName: string;
	totalMarks: string;
	isDroppedOrDeleted: boolean;
};

export default function AssessmentMarksModal({
	studentModuleId,
	moduleCode,
	moduleName,
	totalMarks,
	isDroppedOrDeleted,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	const { data, isLoading } = useQuery({
		queryKey: ['assessment-marks-details', studentModuleId],
		queryFn: () => getAssessmentMarksByStudentModuleId(studentModuleId),
		enabled: opened,
	});

	return (
		<>
			<UnstyledButton onClick={open}>
				<Text
					size='sm'
					c={isDroppedOrDeleted ? 'dimmed' : undefined}
					style={{ cursor: 'pointer' }}
				>
					{totalMarks}
				</Text>
			</UnstyledButton>

			<Modal
				opened={opened}
				onClose={close}
				title={
					<Stack gap={2}>
						<Text fw={600}>{moduleName}</Text>
						<Text size='sm' c='dimmed'>
							{moduleCode}
						</Text>
					</Stack>
				}
				size='md'
			>
				{isLoading ? (
					<Stack gap='sm'>
						<Skeleton height={40} />
						<Skeleton height={40} />
						<Skeleton height={40} />
					</Stack>
				) : !data || data.length === 0 ? (
					<Text c='dimmed' ta='center' py='xl'>
						No assessment marks found
					</Text>
				) : (
					<Stack gap='md'>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Assessment</Table.Th>
									<Table.Th ta='center'>Marks</Table.Th>
									<Table.Th ta='center'>Out of</Table.Th>
									<Table.Th ta='center'>Weight</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{data.map((mark) => (
									<Table.Tr key={mark.id}>
										<Table.Td>
											<Group gap={'xs'} align='baseline'>
												<Text size='sm'>
													{getAssessmentTypeLabel(
														mark.assessment.assessmentType
													)}
												</Text>
												<Text size='xs' c='dimmed'>
													({mark.assessment.assessmentNumber})
												</Text>
											</Group>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' fw={500}>
												{mark.marks.toFixed(1)}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='dimmed'>
												{mark.assessment.totalMarks}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='dimmed'>
												{mark.assessment.weight}%
											</Text>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>

						<Box>
							<Group justify='space-between' mb={4}>
								<Text size='sm' fw={500}>
									Total Marks
								</Text>
								<Text size='sm' fw={600}>
									{totalMarks}
								</Text>
							</Group>
							<Progress
								value={Number.parseFloat(totalMarks) || 0}
								size='sm'
								color={getProgressColor(Number.parseFloat(totalMarks) || 0)}
							/>
						</Box>
					</Stack>
				)}
			</Modal>
		</>
	);
}

function getProgressColor(marks: number): string {
	if (marks >= 80) return 'teal';
	if (marks >= 60) return 'blue';
	if (marks >= 50) return 'yellow';
	return 'red';
}
