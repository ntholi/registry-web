'use client';

import { getStructure } from '@academic/structures';
import {
	Accordion,
	Alert,
	Badge,
	Box,
	Card,
	Center,
	Grid,
	Group,
	Loader as MantineLoader,
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import {
	IconAlertCircle,
	IconBook,
	IconClipboardList,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatSemester } from '@/shared/lib/utils/utils';
import type { AcademicHistoryProgram } from '../../../_lib/utils';
import { getAcademicHistory } from '../../../_server/actions';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

export default function StructureView({ stdNo, isActive = true }: Props) {
	const { data: student, isLoading: studentLoading } = useQuery({
		queryKey: ['academic-history', stdNo],
		queryFn: () => getAcademicHistory(stdNo),
		enabled: !!stdNo && isActive,
	});

	const activeProgram = student?.programs?.find(
		(p: AcademicHistoryProgram) => p.status === 'Active'
	);
	const structureId = activeProgram?.structureId;

	const { data: structure, isLoading: structureLoading } = useQuery({
		queryKey: ['structure-details', structureId],
		queryFn: () => (structureId ? getStructure(structureId) : null),
		enabled: !!structureId && isActive,
	});

	if (studentLoading || structureLoading) {
		return <MantineLoader />;
	}

	if (!student) {
		return (
			<Alert color='red' icon={<IconAlertCircle size={16} />}>
				Student not found
			</Alert>
		);
	}

	if (!activeProgram) {
		return (
			<Alert color='yellow' icon={<IconAlertCircle size={16} />}>
				No active program found for this student
			</Alert>
		);
	}

	if (!structure) {
		return (
			<Alert color='yellow' icon={<IconAlertCircle size={16} />}>
				Program structure not found
			</Alert>
		);
	}

	const completedModules = new Set(
		student?.programs
			.flatMap((p) => p.semesters)
			.flatMap((s) => s.studentModules)
			.filter((m) => m.marks !== null && Number(m.marks) >= 50)
			.map((m) => m.semesterModule.module?.name)
	);

	return (
		<Box mih='80vh'>
			<Stack gap='lg'>
				<Card withBorder>
					<Stack gap='xs'>
						<Group>
							<IconClipboardList size={20} />
							<Title order={4}>{structure.code}</Title>
						</Group>
						<Text size='sm' c='dimmed'>
							{structure.program?.name}
						</Text>
						<Group gap='xs'>
							<Badge color='grape' variant='light'>
								{structure.semesters?.length || 0} Semesters
							</Badge>
						</Group>
					</Stack>
				</Card>

				<Accordion variant='separated'>
					{structure.semesters?.map((semester) => (
						<Accordion.Item
							key={semester.semesterNumber}
							value={semester.semesterNumber}
						>
							<Accordion.Control>
								<Group justify='space-between' pr='md'>
									<Group gap='xs'>
										<IconBook size={16} />
										<Text fw={500}>
											{formatSemester(semester.semesterNumber)}
										</Text>
									</Group>
									<Badge variant='light' color='gray'>
										{semester.semesterModules?.length || 0} modules
									</Badge>
								</Group>
							</Accordion.Control>
							<Accordion.Panel>
								<Table>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Code</Table.Th>
											<Table.Th>Module Name</Table.Th>
											<Table.Th>Type</Table.Th>
											<Table.Th>Credits</Table.Th>
											<Table.Th>Status</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{semester.semesterModules?.map((mod) => {
											const isCompleted = completedModules.has(
												mod.module?.name
											);
											return (
												<Table.Tr key={mod.id}>
													<Table.Td>
														<Text size='sm' fw={500}>
															{mod.module?.code}
														</Text>
													</Table.Td>
													<Table.Td>
														<Text size='sm'>{mod.module?.name}</Text>
													</Table.Td>
													<Table.Td>
														<Badge
															size='xs'
															color={mod.type === 'Elective' ? 'grape' : 'blue'}
															variant='light'
														>
															{mod.type}
														</Badge>
													</Table.Td>
													<Table.Td>
														<Text size='sm'>{mod.credits}</Text>
													</Table.Td>
													<Table.Td>
														<Badge
															size='xs'
															color={isCompleted ? 'green' : 'gray'}
															variant={isCompleted ? 'filled' : 'light'}
														>
															{isCompleted ? 'Completed' : 'Pending'}
														</Badge>
													</Table.Td>
												</Table.Tr>
											);
										})}
									</Table.Tbody>
								</Table>

								{semester.semesterModules?.some(
									(m) => m.prerequisites && m.prerequisites.length > 0
								) && (
									<Box mt='md'>
										<Text size='sm' fw={500} mb='xs'>
											Prerequisites
										</Text>
										<Stack gap='xs'>
											{semester.semesterModules
												?.filter(
													(m) => m.prerequisites && m.prerequisites.length > 0
												)
												.map((mod) => (
													<PrerequisiteDisplay
														key={mod.id}
														moduleCode={mod.module?.code ?? ''}
														moduleName={mod.module?.name ?? ''}
														prerequisites={
															mod.prerequisites as Array<{
																prerequisite: {
																	module?: {
																		code: string | null;
																		name: string | null;
																	} | null;
																};
															}>
														}
														completedModules={completedModules}
													/>
												))}
										</Stack>
									</Box>
								)}
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
			</Stack>
		</Box>
	);
}

function PrerequisiteDisplay({
	moduleCode,
	moduleName,
	prerequisites,
	completedModules,
}: {
	moduleCode: string;
	moduleName: string;
	prerequisites: Array<{
		prerequisite: {
			module?: { code: string | null; name: string | null } | null;
		};
	}>;
	completedModules: Set<string | null | undefined>;
}) {
	return (
		<Paper withBorder p='xs'>
			<Group justify='space-between'>
				<Text size='sm' fw={500}>
					{moduleCode}: {moduleName}
				</Text>
				<Group gap='xs'>
					{prerequisites.map((prereq, idx) => {
						const isPrereqCompleted = completedModules.has(
							prereq.prerequisite.module?.name
						);
						return (
							<Badge
								key={idx}
								size='xs'
								color={isPrereqCompleted ? 'green' : 'red'}
								variant='light'
							>
								{prereq.prerequisite.module?.code}
							</Badge>
						);
					})}
				</Group>
			</Group>
		</Paper>
	);
}

export function StructureViewLoader() {
	return (
		<Center mih='80vh'>
			<Stack align='center' gap='md'>
				<Skeleton height={100} width={400} radius='md' />
				<Grid gutter='md'>
					{[1, 2, 3, 4].map((i) => (
						<Grid.Col key={i} span={6}>
							<Skeleton height={150} radius='md' />
						</Grid.Col>
					))}
				</Grid>
			</Stack>
		</Center>
	);
}
