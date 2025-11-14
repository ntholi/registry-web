'use client';

import {
	Alert,
	Badge,
	Card,
	Group,
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconBook, IconInfoCircle, IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getStructure } from '@/modules/academic/features/structures/server/actions';
import { getAcademicHistory } from '@/modules/registry/features/students/server/actions';
import { formatSemester } from '@/shared/lib/utils/utils';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

export default function StructureView({ stdNo, isActive = false }: Props) {
	const { data: student, isLoading: studentLoading } = useQuery({
		queryKey: ['student', stdNo],
		queryFn: () => getAcademicHistory(stdNo),
		enabled: isActive && !!stdNo,
	});

	const activeProgram = student?.programs?.find((p) => p.status === 'Active');
	const structureId = activeProgram?.structureId;

	const { data: structure, isLoading: structureLoading } = useQuery({
		queryKey: ['structure', structureId],
		queryFn: () => getStructure(structureId!),
		enabled: isActive && !!structureId,
	});

	const isLoading = studentLoading || structureLoading;

	if (isLoading) {
		return <Loader />;
	}

	if (!student?.programs?.length) {
		return (
			<Alert
				icon={<IconInfoCircle size={16} />}
				title='No Programs Found'
				color='blue'
			>
				This student has no programs enrolled.
			</Alert>
		);
	}

	if (!activeProgram) {
		return (
			<Alert
				icon={<IconInfoCircle size={16} />}
				title='No Active Program'
				color='blue'
			>
				This student has no active program.
			</Alert>
		);
	}

	if (!structure) {
		return (
			<Alert
				icon={<IconInfoCircle size={16} />}
				title='Structure Not Found'
				color='red'
			>
				Program structure details could not be loaded.
			</Alert>
		);
	}

	return (
		<Stack gap='lg'>
			<Paper shadow='sm' p='md' withBorder>
				<Group>
					<ThemeIcon variant='light' color='blue' size='xl'>
						<IconBook size='1.1rem' />
					</ThemeIcon>
					<Stack gap={4}>
						<Title order={4}>{structure.code}</Title>
						<Group gap='xs'>
							<Text size='sm' c='dimmed'>
								{structure.program?.name}
							</Text>
							<Badge size='xs' variant='light' color='gray'>
								{structure.program?.school?.name}
							</Badge>
						</Group>
					</Stack>
				</Group>
			</Paper>

			<Stack gap='lg'>
				{structure.semesters && structure.semesters.length > 0 ? (
					structure.semesters.map((semester) => (
						<Paper key={semester.id} shadow='sm' p='md' withBorder>
							<Stack gap='md'>
								<Group justify='space-between' align='center'>
									<Group gap='xs'>
										<Title order={5} fw={500}>
											{formatSemester(semester.semesterNumber)}
										</Title>
									</Group>
									<Text size='sm' c='dimmed'>
										{semester.semesterModules?.length || 0} modules
									</Text>
								</Group>

								{semester.semesterModules &&
								semester.semesterModules.length > 0 ? (
									<Table withTableBorder withColumnBorders>
										<Table.Thead>
											<Table.Tr>
												<Table.Th w={120}>Code</Table.Th>
												<Table.Th w={330}>Name</Table.Th>
												<Table.Th w={120}>Type</Table.Th>
												<Table.Th w={100}>Credits</Table.Th>
												<Table.Th w={400}>Prerequisites</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{semester.semesterModules.map((semModule) => (
												<Table.Tr key={semModule.id}>
													<Table.Td>
														<Text size='sm' fw={500}>
															{semModule.module?.code}
														</Text>
													</Table.Td>
													<Table.Td>
														<Text size='sm'>{semModule.module?.name}</Text>
													</Table.Td>
													<Table.Td>
														<Badge size='sm' variant='light'>
															{semModule.type}
														</Badge>
													</Table.Td>
													<Table.Td>
														<Text size='sm'>{semModule.credits}</Text>
													</Table.Td>
													<Table.Td>
														<PrerequisiteDisplay
															prerequisites={semModule.prerequisites || []}
														/>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								) : (
									<Card withBorder variant='light' p='md'>
										<Text size='sm' c='dimmed' ta='center'>
											No modules found for this semester
										</Text>
									</Card>
								)}
							</Stack>
						</Paper>
					))
				) : (
					<Paper shadow='sm' p='xl' withBorder>
						<Stack align='center' gap='xs'>
							<IconSchool size={48} />
							<Text size='lg' fw={500}>
								No Semesters Found
							</Text>
							<Text size='sm' c='dimmed' ta='center'>
								This program structure currently has no semesters defined.
							</Text>
						</Stack>
					</Paper>
				)}
			</Stack>
		</Stack>
	);
}

function PrerequisiteDisplay({
	prerequisites,
}: {
	prerequisites: Array<{
		prerequisite: {
			id: number;
			type: 'Delete' | 'Major' | 'Minor' | 'Core' | 'Elective';
			createdAt: Date | null;
			moduleId: number | null;
			credits: number;
			semesterId: number | null;
			hidden: boolean;
			module?: {
				code: string;
				name: string;
			} | null;
		};
	}>;
}) {
	if (!prerequisites || prerequisites.length === 0) {
		return (
			<Text size='xs' c='dimmed'>
				None
			</Text>
		);
	}

	return (
		<Stack gap={2}>
			{prerequisites.map((prereq) => (
				<Text
					key={prereq.prerequisite.module?.code || prereq.prerequisite.id}
					size='xs'
					c='dimmed'
				>
					{prereq.prerequisite.module?.code} -{' '}
					{prereq.prerequisite.module?.name}
				</Text>
			))}
		</Stack>
	);
}

function Loader() {
	return (
		<Stack gap='lg'>
			<Paper shadow='sm' p='md' withBorder>
				<Group>
					<Skeleton height={40} width={40} radius='md' />
					<Stack gap={4}>
						<Skeleton height={20} width={200} radius='sm' />
						<Group gap='xs'>
							<Skeleton height={16} width={150} radius='sm' />
							<Skeleton height={16} width={80} radius='sm' />
						</Group>
					</Stack>
				</Group>
			</Paper>

			<Stack gap='lg'>
				{Array.from(
					{ length: 3 },
					(_, semIndex) => `skeleton-sem-${semIndex}`
				).map((semKey) => (
					<Paper key={semKey} shadow='sm' p='md' withBorder>
						<Stack gap='md'>
							<Group justify='space-between' align='center'>
								<Skeleton height={20} width={120} radius='sm' />
								<Skeleton height={16} width={80} radius='sm' />
							</Group>
							<Stack gap='xs'>
								{Array.from(
									{ length: 4 },
									(_, moduleIndex) => `${semKey}-module-${moduleIndex}`
								).map((moduleKey) => (
									<Group key={moduleKey} justify='space-between' p='xs'>
										<Group gap='md' style={{ flex: 1 }}>
											<Skeleton height={16} width={80} radius='sm' />
											<Skeleton height={16} width={200} radius='sm' />
											<Skeleton height={16} width={60} radius='sm' />
										</Group>
										<Group gap='md'>
											<Skeleton height={16} width={40} radius='sm' />
											<Skeleton height={16} width={100} radius='sm' />
										</Group>
									</Group>
								))}
							</Stack>
						</Stack>
					</Paper>
				))}
			</Stack>
		</Stack>
	);
}
