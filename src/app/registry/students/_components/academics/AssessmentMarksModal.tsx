'use client';

import { getMarksAudit, getStudentMarks } from '@academic/assessment-marks';
import {
	Anchor,
	Avatar,
	Badge,
	Card,
	Group,
	Modal,
	Skeleton,
	Stack,
	Table,
	Tabs,
	Text,
	Timeline,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHistory, IconListDetails } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentTypeLabel } from '@/app/academic/assessments';
import { getThresholdColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/utils';

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

	const { data: auditData, isLoading: isAuditLoading } = useQuery({
		queryKey: ['student-marks-audit', smId],
		queryFn: () => getMarksAudit(smId),
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
				<Tabs defaultValue='marks'>
					<Tabs.List mb='md'>
						<Tabs.Tab value='marks' leftSection={<IconListDetails size={16} />}>
							Marks
						</Tabs.Tab>
						<Tabs.Tab value='audit' leftSection={<IconHistory size={16} />}>
							Audit History
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='marks'>
						<MarksTabContent
							data={data}
							isLoading={isLoading}
							totalMarks={totalMarks}
						/>
					</Tabs.Panel>

					<Tabs.Panel value='audit'>
						<AuditTabContent data={auditData} isLoading={isAuditLoading} />
					</Tabs.Panel>
				</Tabs>
			</Modal>
		</>
	);
}

type MarksTabContentProps = {
	data: Awaited<ReturnType<typeof getStudentMarks>> | undefined;
	isLoading: boolean;
	totalMarks: string;
};

function MarksTabContent({
	data,
	isLoading,
	totalMarks,
}: MarksTabContentProps) {
	if (isLoading) {
		return (
			<Stack gap='sm'>
				<Skeleton height={40} />
				<Skeleton height={40} />
				<Skeleton height={40} />
			</Stack>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Text c='dimmed' ta='center' py='xl'>
				No assessments found for this module
			</Text>
		);
	}

	return (
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
								{data.reduce((sum, item) => sum + item.assessment.weight, 0)}%
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
			<Card>
				<Group justify='space-between'>
					<Text size='sm' fw={500}>
						Total Marks
					</Text>
					<Badge
						size='lg'
						radius={'xs'}
						variant='light'
						color={getThresholdColor(Number.parseFloat(totalMarks) || 0, {
							moderate: 45,
							good: 50,
						})}
					>
						{totalMarks}
					</Badge>
				</Group>
			</Card>
		</Stack>
	);
}

type AuditTabContentProps = {
	data: Awaited<ReturnType<typeof getMarksAudit>> | undefined;
	isLoading: boolean;
};

function AuditTabContent({ data, isLoading }: AuditTabContentProps) {
	if (isLoading) {
		return (
			<Stack gap='sm'>
				<Skeleton height={40} />
				<Skeleton height={40} />
				<Skeleton height={40} />
			</Stack>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Text c='dimmed' ta='center' py='xl'>
				No audit history found
			</Text>
		);
	}

	return (
		<Timeline active={data.length} bulletSize={28} lineWidth={2}>
			{data.map((audit) => (
				<Timeline.Item
					key={audit.id}
					bullet={
						<Avatar
							src={audit.createdByUser?.image}
							radius='xl'
							size={24}
							color='blue'
						>
							{audit.createdByUser?.name?.charAt(0)?.toUpperCase()}
						</Avatar>
					}
				>
					<Group justify='space-between' wrap='nowrap' align='flex-start'>
						<Stack gap={2}>
							<Group gap='xs'>
								<Text size='sm' fw={500}>
									{audit.createdByUser?.name || 'Unknown'}
								</Text>
								<Badge
									size='xs'
									variant='light'
									color={getAuditActionColor(audit.action)}
								>
									{audit.action}
								</Badge>
							</Group>
							<Text size='xs' c='dimmed'>
								{audit.assessmentMark?.assessment
									? `${getAssessmentTypeLabel(audit.assessmentMark.assessment.assessmentType)} (${audit.assessmentMark.assessment.assessmentNumber})`
									: 'Assessment deleted'}
							</Text>
							<Group gap='xs'>
								{audit.action === 'update' && (
									<>
										<Text size='xs' c='red'>
											{audit.previousMarks?.toFixed(1) ?? '—'}
										</Text>
										<Text size='xs' c='dimmed'>
											→
										</Text>
										<Text size='xs' c='green'>
											{audit.newMarks?.toFixed(1) ?? '—'}
										</Text>
									</>
								)}
								{audit.action === 'create' && (
									<Text size='xs' c='green'>
										{audit.newMarks?.toFixed(1)}
									</Text>
								)}
								{audit.action === 'delete' && (
									<Text size='xs' c='red' td='line-through'>
										{audit.previousMarks?.toFixed(1)}
									</Text>
								)}
							</Group>
						</Stack>
						<Text size='xs' c='dimmed'>
							{formatDateTime(audit.date)}
						</Text>
					</Group>
				</Timeline.Item>
			))}
		</Timeline>
	);
}

function getAuditActionColor(action: string) {
	switch (action) {
		case 'create':
			return 'green';
		case 'update':
			return 'blue';
		case 'delete':
			return 'red';
		default:
			return 'gray';
	}
}
