'use client';

import {
	Badge,
	Flex,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import type { getStudent } from '../../_server/actions';

type AcademicSummaryProps = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

export default function AcademicSummary({ student }: AcademicSummaryProps) {
	if (!student || !student.programs) {
		return null;
	}

	const activeProgram = (student.programs || []).find(
		(p) => p.status === 'Active'
	);

	if (!activeProgram) {
		return null;
	}

	const academicRemarks = getAcademicRemarks([activeProgram]);

	return (
		<div>
			<Flex justify='space-between'>
				<Title order={4} mb='xs' fw={100}>
					Academic Summary
				</Title>
				<Badge
					radius='sm'
					color={getStatusColor(
						academicRemarks.status.toLowerCase() as AllStatusType
					)}
					variant='light'
				>
					{academicRemarks.status}
				</Badge>
			</Flex>
			<Paper p='md' radius='md' withBorder>
				<Grid gutter='xl'>
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Stack gap='sm'>
							<Text size='sm' fw={500} c='dimmed'>
								Academic Status
							</Text>
							<Text size='lg' fw={700}>
								{academicRemarks.status}
							</Text>
							<Text size='sm' c='dimmed'>
								{academicRemarks.details}
							</Text>
						</Stack>
					</Grid.Col>
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Stack gap='sm'>
							<Text size='sm' fw={500} c='dimmed'>
								Performance Metrics
							</Text>
							<Grid gutter='xs'>
								<Grid.Col span={12}>
									<Text size='xs' c='dimmed'>
										Cumulative GPA
									</Text>
									<Text size='sm' fw={600}>
										{academicRemarks.latestPoints?.cgpa.toFixed(2) || '0.00'}
									</Text>
								</Grid.Col>
								<Grid.Col span={6}>
									<Text size='xs' c='dimmed'>
										Credits Attempted
									</Text>
									<Text size='sm' fw={600}>
										{academicRemarks.totalCreditsAttempted}
									</Text>
								</Grid.Col>
								<Grid.Col span={6}>
									<Text size='xs' c='dimmed'>
										Credits Earned
									</Text>
									<Text size='sm' fw={600}>
										{academicRemarks.totalCreditsCompleted}
									</Text>
								</Grid.Col>
							</Grid>
						</Stack>
					</Grid.Col>
					{(academicRemarks.failedModules.length > 0 ||
						academicRemarks.supplementaryModules.length > 0) && (
						<Grid.Col span={12}>
							<Stack gap='sm'>
								<Text size='sm' fw={500} c='dimmed'>
									Outstanding Requirements (
									{academicRemarks.failedModules.length +
										academicRemarks.supplementaryModules.length}
									)
								</Text>
								<Stack gap='xs'>
									{academicRemarks.failedModules.map((module, index) => (
										<Group key={`failed-${module.code}-${index}`} gap='xs'>
											<Badge
												size='xs'
												color={getStatusColor('repeat')}
												variant='dot'
											>
												Repeat
											</Badge>
											<Text size='sm'>
												{module.code} - {module.name}
											</Text>
										</Group>
									))}
									{academicRemarks.supplementaryModules.map((module, index) => (
										<Group
											key={`supplementary-${module.code}-${index}`}
											gap='xs'
										>
											<Badge
												size='xs'
												color={getStatusColor('supplementary')}
												variant='dot'
											>
												Supplementary
											</Badge>
											<Text size='sm'>
												{module.code} - {module.name}
											</Text>
										</Group>
									))}
								</Stack>
							</Stack>
						</Grid.Col>
					)}
				</Grid>
			</Paper>
		</div>
	);
}
