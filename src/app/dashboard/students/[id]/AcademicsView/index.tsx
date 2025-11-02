'use client';

import {
	Accordion,
	Badge,
	Card,
	Divider,
	Flex,
	Group,
	Paper,
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

export default function AcademicsView({ student, showMarks, ...props }: Props) {
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
