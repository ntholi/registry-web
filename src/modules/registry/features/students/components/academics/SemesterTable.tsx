'use client';

import { EditStudentModuleModal } from '@audit-logs/student-modules';
import {
	Anchor,
	Badge,
	Card,
	Group,
	Stack,
	Table,
	Text,
	Tooltip,
	useComputedColorScheme,
} from '@mantine/core';
import { getGradeColor, getStatusColor } from '@student-portal/utils';
import { useSession } from 'next-auth/react';
import { isFailingOrSupGrade as failed } from '@/shared/lib/utils/grades';
import { formatSemester } from '@/shared/lib/utils/utils';

type ModuleTableProps = {
	modules: {
		id: number;
		code: string;
		name: string;
		type: string;
		status: string;
		marks: string;
		grade: string;
		credits: number;
	}[];
	showMarks?: boolean;
	allSemesters?: {
		term: string;
		semesterNumber: string | null;
		studentModules: {
			semesterModule: {
				module: {
					code: string;
				};
			};
			grade: string;
			status: string;
		}[];
	}[];
};

export default function SemesterTable({
	modules,
	showMarks,
	allSemesters,
}: ModuleTableProps) {
	const colorScheme = useComputedColorScheme('dark');
	const { data: session } = useSession();

	const canEdit =
		session?.user?.role === 'registry' || session?.user?.role === 'admin';

	const getModulesWithFailHistory = (moduleCode: string) => {
		if (!allSemesters) return false;

		const attempts = allSemesters
			.filter((sem) =>
				sem.studentModules.some(
					(m) =>
						m.semesterModule.module.code === moduleCode &&
						m.status !== 'Drop' &&
						m.status !== 'Delete'
				)
			)
			.map((sem) => {
				const studentModule = sem.studentModules.find(
					(m) =>
						m.semesterModule.module.code === moduleCode &&
						m.status !== 'Drop' &&
						m.status !== 'Delete'
				);
				return {
					grade: studentModule?.grade ?? '',
				};
			});

		return attempts.some((attempt) => failed(attempt.grade));
	};

	const modulesWithFailHistory = modules
		.filter((module) => getModulesWithFailHistory(module.code))
		.map((module) => module.code);

	const getModuleAttempts = (moduleCode: string) => {
		if (!allSemesters) return [];

		return allSemesters
			.filter((sem) =>
				sem.studentModules.some(
					(m) =>
						m.semesterModule.module.code === moduleCode &&
						m.status !== 'Drop' &&
						m.status !== 'Delete'
				)
			)
			.map((sem) => {
				const studentModule = sem.studentModules.find(
					(m) =>
						m.semesterModule.module.code === moduleCode &&
						m.status !== 'Drop' &&
						m.status !== 'Delete'
				);
				return {
					term: sem.term,
					semesterNumber: sem.semesterNumber ?? '',
					grade: studentModule?.grade ?? '',
				};
			})
			.sort((a, b) => {
				const [yearA, monthA] = a.term.split('-').map(Number);
				const [yearB, monthB] = b.term.split('-').map(Number);
				if (yearA !== yearB) {
					return yearA - yearB;
				}
				return monthA - monthB;
			});
	};

	const renderAttemptHistory = (module: ModuleTableProps['modules'][0]) => {
		const attempts = getModuleAttempts(module.code);

		if (attempts.length <= 1) {
			return (
				<Stack p='md'>
					<Text size='sm' c='red'>
						Did not Repeat
					</Text>
				</Stack>
			);
		}

		return (
			<Stack p='xs' gap='md'>
				<Text fw={500} size='sm'>
					{module.name}
				</Text>
				<Stack gap='xs'>
					{attempts.map((attempt) => (
						<Card key={`${attempt.term}-${attempt.grade}`} p='xs' withBorder>
							<Group justify='space-between' gap='xl'>
								<Stack gap={2}>
									<Text size='sm' fw={500}>
										{attempt.term}
									</Text>
									<Text size='xs' c='dimmed'>
										{attempt.semesterNumber
											? formatSemester(attempt.semesterNumber)
											: ''}
									</Text>
								</Stack>
								<Badge
									size='md'
									variant='light'
									color={getGradeColor(attempt.grade)}
								>
									{attempt.grade}
								</Badge>
							</Group>
						</Card>
					))}
				</Stack>
			</Stack>
		);
	};

	return (
		<Table.ScrollContainer minWidth={600} type='native'>
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
					{modules.map((module) => {
						const isDroppedOrDeleted =
							module.status === 'Drop' || module.status === 'Delete';

						return (
							<Table.Tr
								key={`${module.id}-${module.marks}-${module.status}`}
								style={
									isDroppedOrDeleted
										? {
												textDecoration: 'line-through',
												color: 'var(--mantine-color-dimmed)',
											}
										: undefined
								}
							>
								<Table.Td>
									<Group
										gap='xs'
										align='center'
										pos={'relative'}
										className='module-code-group'
									>
										<style>{`
											.module-code-group:hover .edit-module-icon {
												opacity: 1 !important;
											}
										`}</style>
										{modulesWithFailHistory.includes(module.code) ? (
											<Tooltip
												label={renderAttemptHistory(module)}
												color={colorScheme}
												withArrow
												multiline
												transitionProps={{
													transition: 'fade',
													duration: 200,
												}}
											>
												<Anchor
													size='sm'
													c={
														isDroppedOrDeleted
															? 'dimmed'
															: failed(module.grade)
																? 'red'
																: 'blue'
													}
												>
													{module.code}
												</Anchor>
											</Tooltip>
										) : (
											<Text
												size='sm'
												c={isDroppedOrDeleted ? 'dimmed' : undefined}
											>
												{module.code}
											</Text>
										)}
										{canEdit && (
											<EditStudentModuleModal
												pos={'absolute'}
												right={-13}
												module={{
													id: module.id,
													code: module.code,
													name: module.name,
													status: module.status as never,
													marks: module.marks,
													grade: module.grade as never,
												}}
											/>
										)}
									</Group>
								</Table.Td>
								<Table.Td>
									<Text size='sm' c={isDroppedOrDeleted ? 'dimmed' : undefined}>
										{module.name}
									</Text>
								</Table.Td>
								<Table.Td>
									<Text
										size='sm'
										c={
											['Drop', 'Delete'].includes(module.status)
												? getStatusColor(module.status)
												: undefined
										}
									>
										{module.status}
									</Text>
								</Table.Td>
								<Table.Td>
									<Text size='sm' c={isDroppedOrDeleted ? 'dimmed' : undefined}>
										{module.credits}
									</Text>
								</Table.Td>
								{showMarks && (
									<Table.Td>
										<Text
											size='sm'
											c={isDroppedOrDeleted ? 'dimmed' : undefined}
										>
											{module.marks}
										</Text>
									</Table.Td>
								)}
								<Table.Td>
									<Badge
										size='sm'
										variant='light'
										color={getGradeColor(module.grade)}
										style={isDroppedOrDeleted ? { opacity: 0.7 } : undefined}
									>
										{module.grade}
									</Badge>
								</Table.Td>
							</Table.Tr>
						);
					})}
				</Table.Tbody>
			</Table>
		</Table.ScrollContainer>
	);
}
