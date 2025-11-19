'use client';

import {
	Accordion,
	ActionIcon,
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
import { IconEdit, IconSchool } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { EditStudentSemesterModal } from '@updated-records/student-semesters';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import { formatSemester } from '@/shared/lib/utils/utils';
import SemesterStatus from '@/shared/ui/SemesterStatus';
import type { getStudent } from '../../server/actions';
import GpaDisplay from './GpaDisplay';
import SemesterTable from './SemesterTable';

type Props = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	showMarks?: boolean;
} & StackProps;

export default function AcademicsView({ student, showMarks, ...props }: Props) {
	const { data: session } = useSession();
	const [openPrograms, setOpenPrograms] = useState<string[]>();
	const [editModalOpened, setEditModalOpened] = useState(false);
	const [selectedSemester, setSelectedSemester] = useState<{
		id: number;
		term: string;
		structureSemesterId: number;
		status: string;
		sponsorId: number | null;
		studentProgramId: number;
		structureId: number;
	} | null>(null);

	const canEdit = session?.user?.role === 'registry' || session?.user?.role === 'admin';

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
																	{semester.term}
																</Badge>
																<Text size='sm'>
																	{formatSemester(
																		semester.structureSemester?.semesterNumber
																	)}
																</Text>
																{canEdit && (
																	<ActionIcon
																		size='sm'
																		variant='subtle'
																		color='gray'
																		onClick={() => {
																			setSelectedSemester({
																				id: semester.id,
																				term: semester.term,
																				structureSemesterId:
																					semester.structureSemesterId,
																				status: semester.status,
																				sponsorId: semester.sponsorId,
																				studentProgramId:
																					semester.studentProgramId,
																				structureId: program.structure.id,
																			});
																			setEditModalOpened(true);
																		}}
																		style={{
																			opacity: 0,
																			transition: 'opacity 0.2s',
																		}}
																		className='edit-semester-icon'
																	>
																		<IconEdit size='1rem' />
																	</ActionIcon>
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
			{selectedSemester && (
				<EditStudentSemesterModal
					semester={selectedSemester as never}
					structureId={selectedSemester.structureId}
					opened={editModalOpened}
					onClose={() => {
						setEditModalOpened(false);
						setSelectedSemester(null);
					}}
				/>
			)}
			<style>
				{`
					.mantine-Paper-root:hover .edit-semester-icon {
						opacity: 1 !important;
					}
				`}
			</style>
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
