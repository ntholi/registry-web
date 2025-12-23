'use client';

import {
	ActionIcon,
	Badge,
	Flex,
	Group,
	Paper,
	Table,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { assessments } from '@/modules/academic/database';
import {
	getAssessmentNumberLabel,
	getAssessmentTypeLabel,
} from '../_lib/utils';
import { getAssessmentByModuleId } from '../_server/actions';
import AssessmentAuditModal from './AssessmentAuditModal';
import AssessmentDelete from './AssessmentDelete';
import AssessmentModal from './AssessmentModal';

type Assessment = typeof assessments.$inferSelect;

interface Props {
	moduleId: number;
}

export default function AssessmentsTable({ moduleId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedAssessment, setSelectedAssessment] = useState<
		Assessment | undefined
	>(undefined);

	const { data: assessmentsList, isLoading } = useQuery({
		queryKey: ['assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
	});

	const handleAddAssessment = () => {
		setSelectedAssessment(undefined);
		open();
	};

	const handleEditAssessment = (assessment: Assessment) => {
		setSelectedAssessment(assessment);
		open();
	};

	return (
		<Paper p='md' radius='md' withBorder shadow='sm'>
			<Flex justify='space-between' mb='md'>
				<Group align='end'>
					<Title order={4} fw={400}>
						Assessments
					</Title>
					<Badge variant='light' radius={'xs'}>
						Weight:{' '}
						{assessmentsList?.reduce(
							(sum: number, a: Assessment) => sum + a.weight,
							0
						) ?? 0}
						%
					</Badge>
				</Group>
				<ActionIcon
					variant='gradient'
					size={'md'}
					onClick={handleAddAssessment}
				>
					<IconPlus size={'1.25rem'} />
				</ActionIcon>
			</Flex>
			{isLoading ? (
				<Text c='dimmed' ta='center' py='xl'>
					Loading assessments...
				</Text>
			) : assessmentsList && assessmentsList.length > 0 ? (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Number</Table.Th>
							<Table.Th>Type</Table.Th>
							<Table.Th>Total Marks</Table.Th>
							<Table.Th>Weight</Table.Th>
							<Table.Th>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{assessmentsList.map((assessment) => (
							<Table.Tr key={assessment.id}>
								<Table.Td>
									{getAssessmentNumberLabel(assessment.assessmentNumber)}
								</Table.Td>
								<Table.Td>
									{getAssessmentTypeLabel(assessment.assessmentType)}
								</Table.Td>
								<Table.Td>{assessment.totalMarks}</Table.Td>
								<Table.Td>{assessment.weight}%</Table.Td>
								<Table.Td>
									<Group gap='xs'>
										<Tooltip label='Edit'>
											<ActionIcon
												variant='subtle'
												color='blue'
												onClick={() => handleEditAssessment(assessment)}
											>
												<IconEdit size={16} />
											</ActionIcon>
										</Tooltip>
										<AssessmentAuditModal assessment={assessment} />
										<AssessmentDelete assessment={assessment} />
									</Group>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			) : (
				<Text c='dimmed' ta='center' size='sm' py='xl'>
					No Assessments
				</Text>
			)}

			<AssessmentModal
				moduleId={moduleId}
				assessment={selectedAssessment}
				opened={opened}
				onClose={close}
			/>
		</Paper>
	);
}
