'use client';
import {
	Accordion,
	Alert,
	Badge,
	Divider,
	Group,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { Fragment } from 'react';
import { getGradePoints } from '@/shared/lib/utils/grades';
import Link from '@/shared/ui/Link';
import type {
	BoeClassReport,
	BoeSchoolGroupedReports,
} from '../_server/service';

const NAME_WIDTH = 180;
const STUDENT_ID_WIDTH = 100;

interface ClassReportTableProps {
	report: BoeClassReport;
}

export function ClassReportTable({ report }: ClassReportTableProps) {
	const moduleColumns = report.allModules;

	return (
		<ScrollArea>
			<Table highlightOnHover withTableBorder withColumnBorders fz='0.85rem'>
				<Table.Thead>
					<Table.Tr>
						<Table.Th
							rowSpan={3}
							style={{ verticalAlign: 'bottom', width: 40 }}
						>
							No
						</Table.Th>
						<Table.Th
							rowSpan={3}
							style={{ verticalAlign: 'bottom', minWidth: NAME_WIDTH }}
						>
							Name
						</Table.Th>
						<Table.Th
							rowSpan={3}
							style={{ verticalAlign: 'bottom', minWidth: STUDENT_ID_WIDTH }}
						>
							Student ID
						</Table.Th>
						{moduleColumns.map((mod) => (
							<Table.Th
								key={mod.code}
								colSpan={3}
								style={{ textAlign: 'center' }}
							>
								{mod.name}
							</Table.Th>
						))}
						<Table.Th
							rowSpan={3}
							style={{
								textAlign: 'center',
								verticalAlign: 'bottom',
								width: 50,
							}}
						>
							GPA
						</Table.Th>
					</Table.Tr>
					<Table.Tr>
						{moduleColumns.map((mod) => (
							<Table.Th
								key={`code-${mod.code}`}
								colSpan={3}
								style={{ textAlign: 'center' }}
							>
								{mod.code}
							</Table.Th>
						))}
					</Table.Tr>
					<Table.Tr>
						{moduleColumns.map((mod) => (
							<Table.Th
								key={`credits-${mod.code}`}
								colSpan={3}
								style={{ textAlign: 'center' }}
							>
								{mod.credits} cr
							</Table.Th>
						))}
					</Table.Tr>
					<Table.Tr>
						<Table.Th />
						<Table.Th />
						<Table.Th />
						{moduleColumns.map((mod) => (
							<Fragment key={`header-cols-${mod.code}`}>
								<Table.Th
									key={`mk-${mod.code}`}
									style={{ textAlign: 'center' }}
								>
									Mk
								</Table.Th>
								<Table.Th
									key={`gr-${mod.code}`}
									style={{ textAlign: 'center' }}
								>
									Gr
								</Table.Th>
								<Table.Th
									key={`pt-${mod.code}`}
									style={{ textAlign: 'center' }}
								>
									Pt
								</Table.Th>
							</Fragment>
						))}
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{report.students.map((student, idx) => (
						<Table.Tr key={student.studentId}>
							<Table.Td>{idx + 1}</Table.Td>
							<Table.Td style={{ width: NAME_WIDTH, maxWidth: NAME_WIDTH }}>
								{student.studentName}
							</Table.Td>
							<Table.Td style={{ width: STUDENT_ID_WIDTH }}>
								<Link
									size='sm'
									target='_blank'
									href={`/registry/students/${student.studentId}?tab=academic`}
								>
									{student.studentId}
								</Link>
							</Table.Td>
							{moduleColumns.map((mod) => {
								const studentMod = student.modules.find(
									(m) => m.code === mod.code
								);
								if (!studentMod) {
									return (
										<Table.Td
											key={`empty-${mod.code}`}
											colSpan={3}
											style={{ textAlign: 'center' }}
										>
											-
										</Table.Td>
									);
								}
								const marks = parseFloat(studentMod.marks);
								const points =
									getGradePoints(studentMod.grade) * studentMod.credits;
								return (
									<Fragment
										key={`student-${student.studentId}-mod-${mod.code}`}
									>
										<Table.Td
											key={`mk-${mod.code}-${student.studentId}`}
											style={{ textAlign: 'center' }}
										>
											{Number.isNaN(marks) ? studentMod.marks : marks}
										</Table.Td>
										<Table.Td
											key={`gr-${mod.code}-${student.studentId}`}
											style={{ textAlign: 'center' }}
										>
											{studentMod.grade}
										</Table.Td>
										<Table.Td
											key={`pt-${mod.code}-${student.studentId}`}
											style={{ textAlign: 'center' }}
										>
											{Number.isNaN(points) ? '' : points.toFixed(2)}
										</Table.Td>
									</Fragment>
								);
							})}
							<Table.Td style={{ textAlign: 'center' }}>{student.gpa}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}

interface ClassReportsListProps {
	reports?: BoeSchoolGroupedReports[];
	loading?: boolean;
}

export function ClassReportsList({ reports, loading }: ClassReportsListProps) {
	if (loading) {
		return (
			<Stack>
				{Array.from({ length: 2 }, (_, i) => (
					<Paper key={`skeleton-${i}`} withBorder p='md'>
						<Skeleton height={24} width={200} mb='sm' />
						<Skeleton height={200} />
					</Paper>
				))}
			</Stack>
		);
	}

	if (!reports || reports.length === 0) {
		return (
			<Alert color='blue' variant='light'>
				No class reports available for the selected criteria.
			</Alert>
		);
	}

	return (
		<Stack gap='xl'>
			{reports.map((schoolGroup, index) => (
				<Stack key={schoolGroup.schoolName} gap='md'>
					{reports.length > 1 && index > 0 && <Divider mb='xs' />}
					<Accordion variant='separated'>
						{schoolGroup.reports.map((report) => (
							<Accordion.Item key={report.className} value={report.className}>
								<Accordion.Control>
									<Group justify='space-between' align='center'>
										<div>
											<Text fw={500}>{report.className}</Text>
											<Text size='xs' c='dimmed'>
												{report.programName}
											</Text>
										</div>
										<Badge size='sm' variant='default' mr='md'>
											{report.students.length} student
											{report.students.length !== 1 ? 's' : ''}
										</Badge>
									</Group>
								</Accordion.Control>
								<Accordion.Panel>
									<ClassReportTable report={report} />
								</Accordion.Panel>
							</Accordion.Item>
						))}
					</Accordion>
				</Stack>
			))}
		</Stack>
	);
}
