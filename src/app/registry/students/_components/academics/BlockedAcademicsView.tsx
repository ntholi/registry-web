'use client';

import type { getBlockedStudentByStdNo } from '@finance/blocked-students';
import {
	Accordion,
	Anchor,
	Badge,
	Box,
	Card,
	Divider,
	Flex,
	Group,
	Paper,
	Stack,
	Table,
	Text,
	ThemeIcon,
	useMantineColorScheme,
} from '@mantine/core';
import { getStatusColor } from '@student-portal/utils';
import { IconLock, IconSchool } from '@tabler/icons-react';
import { useState } from 'react';
import type { getStudent } from '../../_server/actions';
import GpaDisplay from './GpaDisplay';

type Props = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	showMarks?: boolean;
	blockedStudent: NonNullable<
		Awaited<ReturnType<typeof getBlockedStudentByStdNo>>
	>;
};

export default function BlockedAcademicsView({
	student,
	showMarks,
	blockedStudent,
}: Props) {
	const [openPrograms, setOpenPrograms] = useState<string[]>(
		student.programs
			.filter((program) => program.status === 'Active')
			.map((program) => program.id?.toString() ?? '')
	);

	const { colorScheme } = useMantineColorScheme();

	const isDark = colorScheme === 'dark';

	const overlayBackground = isDark
		? 'rgba(0, 0, 0, 0.3)'
		: 'rgba(255, 255, 255, 0.8)';

	const generatePlaceholderSemesters = () => {
		return Array.from({ length: 3 }, (_, i) => ({
			id: i + 1,
			termCode: `████████`,
			semesterNumber: i + 1,
			status: 'Active',
			moduleCount: Math.floor(Math.random() * 3) + 4,
		}));
	};

	if (!student?.programs?.length) {
		return (
			<Card shadow='sm' padding='lg' radius='md' withBorder>
				<Text fw={500} c='dimmed'>
					No academic programs found
				</Text>
			</Card>
		);
	}

	return (
		<Stack gap='md'>
			<Accordion
				variant='separated'
				radius='md'
				multiple
				value={openPrograms}
				onChange={setOpenPrograms}
			>
				{student.programs.map((program) => {
					const placeholderSemesters = generatePlaceholderSemesters();

					return (
						<Accordion.Item
							key={program.id}
							value={program.id?.toString() ?? ''}
						>
							<Accordion.Control>
								<Group>
									<ThemeIcon variant='light' color='gray' size={'xl'}>
										<IconSchool size='1.1rem' />
									</ThemeIcon>
									<Stack gap={5}>
										<Text fw={500}>{program.structure.program.name}</Text>
										<Group gap={'xs'}>
											<Badge
												color={getStatusColor(program.status)}
												size='xs'
												variant='transparent'
											>
												{program.status}
											</Badge>
											<Anchor size='0.715rem' c={'gray'} component='span'>
												{program.structure.code}
											</Anchor>
										</Group>
									</Stack>
								</Group>
							</Accordion.Control>

							<Accordion.Panel>
								<Box pos='relative'>
									<Box
										style={{
											filter: 'blur(4px)',
											opacity: 0.3,
											pointerEvents: 'none',
										}}
									>
										<Stack gap='xl'>
											{placeholderSemesters.map((semester) => (
												<Paper key={semester.id} p='md' withBorder>
													<Stack gap='md'>
														<Flex align='flex-end' justify='space-between'>
															<Group gap={'xs'} align='flex-end'>
																<Badge radius={'xs'} variant='default'>
																	{semester.termCode}
																</Badge>
																<Text size='sm'>
																	Semester {semester.semesterNumber}
																</Text>
															</Group>
															<Group gap='md' align='flex-end'>
																<GpaDisplay gpa={2.5} cgpa={2.8} />
															</Group>
														</Flex>

														<Divider />

														<BlockedModuleTable
															moduleCount={semester.moduleCount}
															showMarks={showMarks}
														/>
													</Stack>
												</Paper>
											))}
										</Stack>
									</Box>

									<Box
										pos='absolute'
										top={0}
										left={0}
										right={0}
										bottom={0}
										style={{
											background: overlayBackground,
											backdropFilter: 'blur(2px)',
											display: 'flex',
											paddingTop: '80px',
											justifyContent: 'center',
											zIndex: 10,
										}}
									>
										<Stack align='center' gap='md'>
											<ThemeIcon size={60} color='red' variant='light'>
												<IconLock size={30} />
											</ThemeIcon>
											<Text size='xl' fw={700} c='red'>
												BLOCKED
											</Text>
											<Stack align='center' gap='xs'>
												<Text size='sm' c='dimmed' ta='center'>
													Academic records are restricted
												</Text>
												<Box
													style={{
														borderTop: '1px solid var(--mantine-color-gray-4)',
														paddingTop: '8px',
													}}
												>
													<Stack align='center' gap={4}>
														<Text size='xs' fw={500} c='red'>
															Reason: {blockedStudent.reason}
														</Text>
														<Text size='xs' c='dimmed'>
															Blocked by: {blockedStudent.byDepartment}
														</Text>
													</Stack>
												</Box>
											</Stack>
										</Stack>
									</Box>
								</Box>
							</Accordion.Panel>
						</Accordion.Item>
					);
				})}
			</Accordion>
		</Stack>
	);
}

type BlockedModuleTableProps = {
	moduleCount: number;
	showMarks?: boolean;
};

function BlockedModuleTable({
	moduleCount,
	showMarks,
}: BlockedModuleTableProps) {
	const placeholderChar = '████████';
	const shortPlaceholderChar = '██';

	const placeholderModules = Array.from({ length: moduleCount }, (_, i) => ({
		id: `placeholder-${Math.random()}-${i}`,
		code: placeholderChar,
		name: `${placeholderChar}${placeholderChar}${placeholderChar}`,
		type: placeholderChar,
		status: placeholderChar,
		marks: shortPlaceholderChar,
		grade: shortPlaceholderChar,
		credits: shortPlaceholderChar,
	}));

	return (
		<Table>
			<Table.Thead>
				<Table.Tr>
					<Table.Th w={105}>Code</Table.Th>
					<Table.Th w={270}>Name</Table.Th>
					<Table.Th w={105}>Status</Table.Th>
					<Table.Th w={50}>Cr</Table.Th>
					{showMarks && <Table.Th w={50}>Mk</Table.Th>}
					<Table.Th w={60}>Gd</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{placeholderModules.map((module) => (
					<Table.Tr key={module.id}>
						<Table.Td>
							<Text size='sm'>{module.code}</Text>
						</Table.Td>
						<Table.Td>
							<Text size='sm'>{module.name}</Text>
						</Table.Td>
						<Table.Td>
							<Text size='sm'>{module.status}</Text>
						</Table.Td>
						<Table.Td>
							<Text size='sm'>{module.credits}</Text>
						</Table.Td>
						{showMarks && (
							<Table.Td>
								<Text size='sm'>{module.marks}</Text>
							</Table.Td>
						)}
						<Table.Td>
							<Badge size='sm' variant='light' color='gray'>
								{module.grade}
							</Badge>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
