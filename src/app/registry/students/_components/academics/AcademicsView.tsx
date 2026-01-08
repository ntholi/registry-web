'use client';

import { EditStudentProgramModal } from '@audit-logs/student-programs';
import { EditStudentSemesterModal } from '@audit-logs/student-semesters';
import {
	Accordion,
	Badge,
	Box,
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
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import SemesterStatus from '@/app/registry/students/_components/academics/SemesterStatus';
import { useMediaQuery } from '@/shared/lib/hooks/use-media-query';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import { formatSemester } from '@/shared/lib/utils/utils';
import type { getStudent } from '../../_server/actions';
import GpaDisplay from './GpaDisplay';
import SemesterTable from './SemesterTable';

type Props = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	showMarks?: boolean;
} & StackProps;

export default function AcademicsView({ student, showMarks, ...props }: Props) {
	const { data: session } = useSession();
	const [openPrograms, setOpenPrograms] = useState<string[]>();
	const isMobile = useMediaQuery('(max-width: 768px)');

	const canEdit =
		session?.user?.role === 'registry' || session?.user?.role === 'admin';

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
			{isMobile ? (
				<Stack gap='md'>
					{student.programs.map((program) => (
						<Card
							key={program.id}
							shadow='sm'
							padding={0}
							radius='md'
							withBorder
						>
							<Stack gap={5}>
								<Box p='md'>
									<Group
										justify='space-between'
										align='flex-start'
										wrap='nowrap'
									>
										<Text fw={500} style={{ flex: 1 }}>
											{program.structure.program.name}
										</Text>
										<Badge
											color={getStatusColor(program.status)}
											size='xs'
											variant='light'
											style={{ flexShrink: 0 }}
										>
											{program.status}
										</Badge>
									</Group>
								</Box>
								{program.semesters?.length ? (
									(() => {
										const academicRemarks = getAcademicRemarks([program]);

										return program.semesters.map((semester) => {
											const semesterPoint = academicRemarks.points.find(
												(point) => point.semesterId === semester.id
											);

											const cumulativeGPA = semesterPoint?.cgpa || 0;

											return (
												<Paper key={semester.id} p={0} radius='md' withBorder>
													<Stack gap={0}>
														<Box p='md'>
															<Flex align='flex-start' justify='space-between'>
																<Stack gap={2} style={{ flex: 1 }}>
																	<Group
																		gap='xs'
																		align='center'
																		wrap='nowrap'
																		style={{ position: 'relative' }}
																	>
																		<Badge radius='xs' variant='default'>
																			{semester.termCode}
																		</Badge>
																		{canEdit && (
																			<EditStudentSemesterModal
																				semester={semester as never}
																				structureId={program.structure.id}
																			/>
																		)}
																	</Group>
																	<Text size='sm' pl='md'>
																		{formatSemester(
																			semester.structureSemester
																				?.semesterNumber,
																			'mini'
																		)}
																	</Text>
																</Stack>
																<Stack
																	gap={2}
																	align='flex-end'
																	style={{ flexShrink: 0 }}
																>
																	<GpaDisplay
																		gpa={semesterPoint?.gpa || 0}
																		cgpa={cumulativeGPA}
																	/>
																	<SemesterStatus status={semester.status} />
																</Stack>
															</Flex>
														</Box>

														<Divider />

														{semester.studentModules?.length ? (
															<SemesterTable
																modules={semester.studentModules.map((sm) => ({
																	id: sm.id,
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
																	credits: sm.credits,
																}))}
																showMarks={showMarks}
																allSemesters={program.semesters.map((sem) => ({
																	termCode: sem.termCode,
																	semesterNumber:
																		sem.structureSemester?.semesterNumber,
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
															<Box p='md'>
																<Text c='dimmed'>
																	No modules found for this semester
																</Text>
															</Box>
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
						</Card>
					))}
				</Stack>
			) : (
				<Accordion
					variant='separated'
					radius='md'
					multiple
					value={openPrograms}
					onChange={setOpenPrograms}
				>
					{student.programs.map((program) => (
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
										<Group gap={'xs'} align='center'>
											<Badge
												color={getStatusColor(program.status)}
												size='xs'
												variant='transparent'
											>
												{program.status}
											</Badge>
											{canEdit && (
												<EditStudentProgramModal
													program={{
														id: program.id,
														stdNo: student.stdNo,
														intakeDate: program.intakeDate,
														regDate: program.regDate,
														startTerm: program.startTerm,
														structureId: program.structureId,
														programId: program.structure.program.id,
														graduationDate: program.graduationDate,
														status: program.status,
													}}
												/>
											)}
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
																<Group
																	gap={'xs'}
																	align='flex-end'
																	style={{ position: 'relative' }}
																>
																	<Badge radius={'xs'} variant='default'>
																		{semester.termCode}
																	</Badge>
																	<Text size='sm'>
																		{formatSemester(
																			semester.structureSemester?.semesterNumber
																		)}
																	</Text>
																	{canEdit && (
																		<EditStudentSemesterModal
																			semester={semester as never}
																			structureId={program.structure.id}
																		/>
																	)}
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
																	modules={semester.studentModules.map(
																		(sm) => ({
																			id: sm.id,
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
																			credits: sm.credits,
																		})
																	)}
																	showMarks={showMarks}
																	allSemesters={program.semesters.map(
																		(sem) => ({
																			termCode: sem.termCode,
																			semesterNumber:
																				sem.structureSemester?.semesterNumber,
																			studentModules: sem.studentModules.map(
																				(m) => ({
																					semesterModule: {
																						module: {
																							code:
																								m.semesterModule.module?.code ??
																								'',
																						},
																					},
																					grade: m.grade,
																					status: m.status,
																				})
																			),
																		})
																	)}
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
			)}
		</Stack>
	);
}
