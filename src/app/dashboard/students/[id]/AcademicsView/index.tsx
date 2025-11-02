'use client';

import {
	Accordion,
	Badge,
	Card,
	Divider,
	Flex,
	Group,
	Paper,
	Skeleton,
	Stack,
	type StackProps,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import Link from '@/components/Link';
import SemesterStatus from '@/components/SemesterStatus';
import { formatSemester } from '@/lib/utils';
import type { getStudent } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import GpaDisplay from './GpaDisplay';
import SemesterTable from './SemesterTable';

type Props = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	showMarks?: boolean;
} & StackProps;

export default function AcademicsView({
	student,
	showMarks,
	...props
}: Props) {
	const [openPrograms, setOpenPrograms] = useState<string[]>();

	useEffect(() => {
		setOpenPrograms(
			student?.programs
				.filter((program) => program.status === 'Active')
				.map((program) => program.id?.toString() ?? '') ?? []
		);
	}, [student]);

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
		<Stack gap='md' {...props}>
			<Accordion
				variant='separated'
				radius='md'
				multiple
				value={openPrograms}
				onChange={setOpenPrograms}
			>
				{student.programs.map((program) => (
					<Accordion.Item key={program.id} value={program.id?.toString() ?? ''}>
						<Accordion.Control>
							<Group>
								<ThemeIcon variant='light' color='gray' size={'xl'}>
									<IconSchool size='1.1rem' />
								</ThemeIcon>
								<Stack gap={5}>
									<Text fw={500}>{program.structure.program.name}</Text>
									<Group gap={'xs'}>
										<Badge
											color={getProgramStatusColor(program.status)}
											size='xs'
											variant='transparent'
										>
											{program.status}
										</Badge>
										<Link
											size='0.715rem'
											c={'gray'}
											href={`/dashboard/schools/structures/${program.structureId}`}
											onClick={(e) => e.stopPropagation()}
										>
											{program.structure.code}
										</Link>
									</Group>
								</Stack>
							</Group>
						</Accordion.Control>

						<Accordion.Panel>
							<Stack gap='xl'>
								{program.semesters?.length ? (
									(() => {
										const academicRemarks = getAcademicRemarks([program]);

										return program.semesters.map((semester) => {
											const semesterPoint = academicRemarks.points.find(
												(point) => point.semesterId === semester.id
											);

											const cumulativeGPA = semesterPoint?.cgpa || 0;

											return (
												<Paper key={semester.id} p='md' withBorder>
													<Stack gap='md'>
														<Flex align='flex-end' justify='space-between'>
															<Group gap={'xs'} align='flex-end'>
																<Badge radius={'xs'} variant='default'>
																	{semester.term}
																</Badge>
																<Text size='sm'>
																	{formatSemester(semester.semesterNumber)}
																</Text>
															</Group>
															<Group gap='md' align='flex-end'>
																<GpaDisplay
																	gpa={semesterPoint?.gpa || 0}
																	cgpa={cumulativeGPA}
																/>
																<SemesterStatus status={semester.status} />
															</Group>
														</Flex>

														<Divider />

														{semester.studentModules?.length ? (
															<SemesterTable
																modules={semester.studentModules.map((sm) => ({
																	id: sm.semesterModuleId,
																	code:
																		sm.semesterModule.module?.code ??
																		`${sm.semesterModuleId}`,
																	name:
																		sm.semesterModule.module?.name ??
																		`<<Semester Module ID: ${sm.semesterModuleId}>>`,
																	type: sm.semesterModule.type,
																	status: sm.status,
																	marks: sm.marks,
																	grade: sm.grade,
																	credits: sm.semesterModule.credits,
																}))}
																showMarks={showMarks}
																allSemesters={program.semesters.map((sem) => ({
																	term: sem.term,
																	semesterNumber: sem.semesterNumber ?? 0,
																	studentModules: sem.studentModules.map(
																		(m) => ({
																			semesterModule: {
																				module: {
																					code:
																						m.semesterModule.module?.code ?? '',
																				},
																			},
																			grade: m.grade,
																			status: m.status,
																		})
																	),
																}))}
															/>
														) : (
															<Text c='dimmed'>
																No modules found for this semester
															</Text>
														)}
													</Stack>
												</Paper>
											);
										});
									})()
								) : (
									<Text c='dimmed'>
										No semesters available for this program
									</Text>
								)}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Stack>
	);
}

function Loader() {
	return (
		<Stack gap='md'>
			<Accordion variant='separated' value={['0']} radius='md' multiple>
				{Array.from(
					{ length: 1 },
					(_, index) => `skeleton-program-${index}`
				).map((key, index) => (
					<Accordion.Item key={key} value={index.toString()}>
						<Accordion.Control>
							<Group>
								<Skeleton height={40} width={40} radius='md' />
								<Stack gap={5}>
									<Skeleton height={20} width={250} radius='sm' />
									<Group gap='xs'>
										<Skeleton height={16} width={60} radius='sm' />
										<Skeleton height={16} width={80} radius='sm' />
									</Group>
								</Stack>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Stack gap='xl'>
								{Array.from(
									{ length: 3 },
									(_, semIndex) => `skeleton-semester-${semIndex}`
								).map((key) => (
									<Paper key={key} p='md' withBorder>
										<Stack gap='md'>
											<Flex align='flex-end' justify='space-between'>
												<Group gap='xs' align='flex-end'>
													<Skeleton height={20} width={80} radius='xs' />
													<Skeleton height={16} width={100} radius='sm' />
												</Group>
												<Group gap='md' align='flex-end'>
													<Stack gap={4} align='flex-end'>
														<Skeleton height={14} width={60} radius='sm' />
														<Skeleton height={14} width={70} radius='sm' />
													</Stack>
													<Skeleton height={20} width={80} radius='sm' />
												</Group>
											</Flex>
											<Divider />
											<Stack gap='xs'>
												{Array.from(
													{ length: 4 },
													(_, moduleIndex) => `skeleton-module-${moduleIndex}`
												).map((key) => (
													<Group key={key} justify='space-between' p='xs'>
														<Group gap='md' style={{ flex: 1 }}>
															<Skeleton height={16} width={80} radius='sm' />
															<Skeleton height={16} width={200} radius='sm' />
															<Skeleton height={16} width={60} radius='sm' />
														</Group>
														<Group gap='md'>
															<Skeleton height={16} width={40} radius='sm' />
															<Skeleton height={16} width={30} radius='sm' />
															<Skeleton height={16} width={50} radius='sm' />
														</Group>
													</Group>
												))}
											</Stack>
										</Stack>
									</Paper>
								))}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Stack>
	);
}

export const getProgramStatusColor = (status: string) => {
	switch (status) {
		case 'Active':
			return 'green';
		case 'Changed':
			return 'blue';
		case 'Completed':
			return 'cyan';
		case 'Deleted':
			return 'red';
		case 'Inactive':
			return 'gray';
		default:
			return 'gray';
	}
};
