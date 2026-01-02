'use client';
import {
	Alert,
	Badge,
	Card,
	Group,
	ScrollArea,
	Skeleton,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { getGradePoints } from '@/shared/lib/utils/grades';
import type { BoeClassReport } from '../_server/service';

interface ClassReportTableProps {
	report: BoeClassReport;
}

export function ClassReportTable({ report }: ClassReportTableProps) {
	const moduleColumns = report.allModules;

	return (
		<Card withBorder>
			<Group justify='space-between' mb='md'>
				<div>
					<Title order={4}>{report.className}</Title>
					<Text size='sm' c='dimmed'>
						{report.programName}
					</Text>
					<Text size='xs' c='dimmed'>
						{report.schoolName}
					</Text>
				</div>
				<Badge size='lg' variant='light'>
					{report.students.length} student
					{report.students.length !== 1 ? 's' : ''}
				</Badge>
			</Group>

			<ScrollArea>
				<Table striped highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th rowSpan={3} style={{ verticalAlign: 'bottom' }}>
								No
							</Table.Th>
							<Table.Th rowSpan={3} style={{ verticalAlign: 'bottom' }}>
								Name
							</Table.Th>
							<Table.Th rowSpan={3} style={{ verticalAlign: 'bottom' }}>
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
								style={{ textAlign: 'center', verticalAlign: 'bottom' }}
							>
								Modules
							</Table.Th>
							<Table.Th
								rowSpan={3}
								style={{ textAlign: 'center', verticalAlign: 'bottom' }}
							>
								Cr. Att.
							</Table.Th>
							<Table.Th
								rowSpan={3}
								style={{ textAlign: 'center', verticalAlign: 'bottom' }}
							>
								Cr. Earn.
							</Table.Th>
							<Table.Th
								rowSpan={3}
								style={{ textAlign: 'center', verticalAlign: 'bottom' }}
							>
								Points
							</Table.Th>
							<Table.Th
								rowSpan={3}
								style={{ textAlign: 'center', verticalAlign: 'bottom' }}
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
								<>
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
								</>
							))}
							<Table.Th />
							<Table.Th />
							<Table.Th />
							<Table.Th />
							<Table.Th />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{report.students.map((student, idx) => (
							<Table.Tr key={student.studentId}>
								<Table.Td>{idx + 1}</Table.Td>
								<Table.Td>{student.studentName}</Table.Td>
								<Table.Td>{student.studentId}</Table.Td>
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
										<>
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
										</>
									);
								})}
								<Table.Td style={{ textAlign: 'center' }}>
									{student.modulesCount}
								</Table.Td>
								<Table.Td style={{ textAlign: 'center' }}>
									{student.creditsAttempted}
								</Table.Td>
								<Table.Td style={{ textAlign: 'center' }}>
									{student.creditsEarned}
								</Table.Td>
								<Table.Td style={{ textAlign: 'center' }}>
									{student.totalPoints.toFixed(2)}
								</Table.Td>
								<Table.Td style={{ textAlign: 'center' }}>
									{student.gpa}
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Card>
	);
}

interface ClassReportsListProps {
	reports?: BoeClassReport[];
	loading?: boolean;
}

export function ClassReportsList({ reports, loading }: ClassReportsListProps) {
	if (loading) {
		return (
			<>
				{Array.from({ length: 2 }, (_, i) => (
					<Card key={`skeleton-${i}`} withBorder>
						<Skeleton height={24} width={200} mb='md' />
						<Skeleton height={300} />
					</Card>
				))}
			</>
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
		<>
			{reports.map((report) => (
				<ClassReportTable key={report.className} report={report} />
			))}
		</>
	);
}
