'use client';

import { getStudentMarks } from '@academic/assessment-marks';
import {
	Anchor,
	Badge,
	Group,
	Modal,
	Skeleton,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentTypeLabel } from '@/app/academic/assessments';
import { getThresholdColor } from '@/shared/lib/utils/colors';

type Props = {
	studentModuleId: number;
	moduleCode: string;
	moduleName: string;
	totalMarks: string;
	isDroppedOrDeleted: boolean;
};

export default function AssessmentMarksModal({
	studentModuleId: smId,
	moduleCode: code,
	moduleName: name,
	totalMarks,
	isDroppedOrDeleted,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	const { data, isLoading } = useQuery({
		queryKey: ['student-marks', smId],
		queryFn: () => getStudentMarks(smId),
		enabled: opened,
	});

	return (
		<>
			<Anchor
				size='sm'
				c={isDroppedOrDeleted ? 'dimmed' : 'gray'}
				onClick={open}
			>
				{totalMarks}
			</Anchor>

			<Modal
				opened={opened}
				onClose={close}
				title={
					<Stack gap={2}>
						<Text fw={600}>{name}</Text>
						<Text size='sm' c='dimmed'>
							{code}
						</Text>
					</Stack>
				}
				size='lg'
			>
				{isLoading ? (
					<Stack gap='sm'>
						<Skeleton height={40} />
						<Skeleton height={40} />
						<Skeleton height={40} />
					</Stack>
				) : !data || data.length === 0 ? (
					<Text c='dimmed' ta='center' py='xl'>
						No assessments found for this module
					</Text>
				) : (
					<Stack gap='md'>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>No.</Table.Th>
									<Table.Th miw={130}>Assessment</Table.Th>
									<Table.Th ta='center'>Weight</Table.Th>
									<Table.Th ta='center'>Marks</Table.Th>
									<Table.Th ta='center'>Total</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{data.map((item) => (
									<Table.Tr key={item.assessment.id}>
										<Table.Td>{item.assessment.assessmentNumber}</Table.Td>
										<Table.Td>
											{getAssessmentTypeLabel(item.assessment.assessmentType)}
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='dimmed'>
												{item.assessment.weight}%
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											{item.marks !== null ? (
												<Group gap={4} justify='center' align='baseline'>
													<Text size='sm' fw={500}>
														{item.marks.toFixed(1)}
													</Text>
													<Text size='xs' c='dimmed'>
														/{item.assessment.totalMarks}
													</Text>
												</Group>
											) : (
												<Group gap={4} justify='center' align='baseline'>
													<Text size='sm' c='dimmed'>
														—
													</Text>
													<Text size='xs' c='dimmed'>
														/{item.assessment.totalMarks}
													</Text>
												</Group>
											)}
										</Table.Td>
										<Table.Td ta='center'>
											{item.marks !== null ? (
												(
													(item.marks / item.assessment.totalMarks) *
													item.assessment.weight
												).toFixed(1)
											) : (
												<Text size='sm' c='dimmed'>
													—
												</Text>
											)}
										</Table.Td>
									</Table.Tr>
								))}
								<Table.Tr>
									<Table.Td colSpan={2} />
									<Table.Td ta='center'>
										<Text size='sm' fw={600}>
											{data.reduce(
												(sum, item) => sum + item.assessment.weight,
												0
											)}
											%
										</Text>
									</Table.Td>
									<Table.Td />
									<Table.Td ta='center'>
										<Text size='sm' fw={600}>
											{data
												.reduce((sum, item) => {
													if (item.marks !== null) {
														return (
															sum +
															(item.marks / item.assessment.totalMarks) *
																item.assessment.weight
														);
													}
													return sum;
												}, 0)
												.toFixed(1)}
										</Text>
									</Table.Td>
								</Table.Tr>
							</Table.Tbody>
						</Table>

						<Group justify='space-between' pt='sm'>
							<Text size='sm' fw={500}>
								Total Marks
							</Text>
							<Badge
								size='lg'
								variant='light'
								color={getThresholdColor(Number.parseFloat(totalMarks) || 0, {
									moderate: 45,
									good: 50,
								})}
							>
								{totalMarks}
							</Badge>
						</Group>
					</Stack>
				)}
			</Modal>
		</>
	);
}
