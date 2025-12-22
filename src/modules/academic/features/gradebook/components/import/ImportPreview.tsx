'use client';

import { getAssessmentTypeLabel } from '@academic/assessments';
import {
	Accordion,
	Badge,
	Group,
	ScrollArea,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { getStudentsByModuleId } from '@registry/students';
import { IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import type {
	AssessmentInfo,
	ColumnMapping,
	ExcelData,
	ParsedRow,
} from './types';
import {
	columnLetterToIndex,
	normalizeStudentNumber,
	parseNumericValue,
} from './utils';

type Props = {
	excelData: ExcelData;
	columnMapping: ColumnMapping;
	assessments: AssessmentInfo[];
	moduleId: number;
	onPreviewGenerated: (rows: ParsedRow[]) => void;
	onBack: () => void;
};

export default function ImportPreview({
	excelData,
	columnMapping,
	assessments,
	moduleId,
	onPreviewGenerated,
}: Props) {
	const { data: registeredStudents } = useQuery({
		queryKey: ['students', moduleId],
		queryFn: () => getStudentsByModuleId(moduleId),
	});

	const parsedData = useMemo(
		() =>
			parseExcelData(
				excelData,
				assessments,
				columnMapping,
				registeredStudents || []
			),
		[excelData, assessments, columnMapping, registeredStudents]
	);

	const validRows = useMemo(
		() => parsedData.filter((row) => row.isValid && row.isRegistered),
		[parsedData]
	);

	const invalidRows = useMemo(
		() => parsedData.filter((row) => !row.isValid),
		[parsedData]
	);

	const unregisteredRows = useMemo(
		() => parsedData.filter((row) => row.isValid && !row.isRegistered),
		[parsedData]
	);
	useEffect(() => {
		onPreviewGenerated(parsedData);
	}, [parsedData, onPreviewGenerated]);
	return (
		<Stack gap='md'>
			<Group align='center' justify='space-between'>
				<Title order={4}>Import Preview</Title>
				<Group gap='sm'>
					<Badge color='green' variant='light'>
						{validRows.length} Valid
					</Badge>
					<Badge color='orange' variant='light'>
						{unregisteredRows.length} Unregistered
					</Badge>
					<Badge color='red' variant='light'>
						{invalidRows.length} Invalid
					</Badge>
				</Group>
			</Group>
			<Accordion variant='separated' defaultValue={'valid-students'}>
				{unregisteredRows.length > 0 && (
					<Accordion.Item value='unregistered-students'>
						<Accordion.Control
							icon={<IconEye size={16} />}
							style={{ cursor: 'pointer' }}
						>
							<Group justify='space-between' style={{ width: '100%' }}>
								<Group>
									<Text fw={500}>Unregistered Students</Text>
									<Text size='sm' c='dimmed'>
										(Click to view details)
									</Text>
								</Group>
								<Badge color='orange' variant='light' size='sm' mr={'md'}>
									{unregisteredRows.length}
								</Badge>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Text size='xs' c='dimmed' mb='sm'>
								These students appear in the Excel file but are not registered
								for this module
							</Text>
							<ScrollArea h={200}>
								<Table striped>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Row</Table.Th>
											<Table.Th>Student Number</Table.Th>
											{assessments.map((assessment) => (
												<Table.Th key={assessment.id}>
													{shorten(
														getAssessmentTypeLabel(assessment.assessmentType)
													)}
													<Text size='xs' c='dimmed'>
														{assessment.totalMarks} · {assessment.weight}%
													</Text>
												</Table.Th>
											))}
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{unregisteredRows.map((row) => (
											<Table.Tr key={row.rowIndex}>
												<Table.Td>{row.rowIndex + 2}</Table.Td>
												<Table.Td>{row.studentNumber}</Table.Td>
												{assessments.map((assessment) => (
													<Table.Td key={assessment.id}>
														{row.assessmentMarks[assessment.id] !== undefined
															? row.assessmentMarks[assessment.id]
															: '-'}
													</Table.Td>
												))}
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</ScrollArea>
						</Accordion.Panel>
					</Accordion.Item>
				)}
				{invalidRows.length > 0 && (
					<Accordion.Item value='invalid-records'>
						<Accordion.Control
							icon={<IconEye size={16} />}
							style={{ cursor: 'pointer' }}
						>
							<Group justify='space-between' style={{ width: '100%' }}>
								<Group>
									<Text fw={500}>Invalid Records</Text>
									<Text size='sm' c='dimmed'>
										(Click to view details)
									</Text>
								</Group>
								<Badge color='red' variant='light' size='sm' mr={'md'}>
									{invalidRows.length}
								</Badge>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<ScrollArea h={200}>
								<Table striped>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Row</Table.Th>
											<Table.Th>Student Number</Table.Th>
											<Table.Th>Errors</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{invalidRows.map((row) => (
											<Table.Tr key={row.rowIndex}>
												<Table.Td>{row.rowIndex + 2}</Table.Td>
												<Table.Td>{row.studentNumber || '-'}</Table.Td>
												<Table.Td>
													<Text size='xs' c='red'>
														{row.errors.join(', ')}
													</Text>
												</Table.Td>
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</ScrollArea>
						</Accordion.Panel>
					</Accordion.Item>
				)}
				{validRows.length > 0 && (
					<Accordion.Item value='valid-students'>
						<Accordion.Control
							icon={<IconEye size={16} />}
							style={{ cursor: 'pointer' }}
						>
							<Group justify='space-between' style={{ width: '100%' }}>
								<Group>
									<Text fw={500}>Students</Text>
									<Text size='sm' c='dimmed'>
										(Click to view details)
									</Text>
								</Group>
								<Badge color='green' variant='light' size='sm' mr={'md'}>
									{validRows.length}
								</Badge>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<ScrollArea h={300}>
								<Table striped highlightOnHover>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Row</Table.Th>
											<Table.Th>Student Number</Table.Th>
											{assessments.map((assessment) => (
												<Table.Th key={assessment.id}>
													{shorten(
														getAssessmentTypeLabel(assessment.assessmentType)
													)}
													<Text size='xs' c='dimmed'>
														{assessment.totalMarks} · {assessment.weight}%
													</Text>
												</Table.Th>
											))}
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{validRows.map((row) => (
											<Table.Tr key={row.rowIndex}>
												<Table.Td>{row.rowIndex + 2}</Table.Td>
												<Table.Td>{row.studentNumber}</Table.Td>
												{assessments.map((assessment) => (
													<Table.Td key={assessment.id}>
														{row.assessmentMarks[assessment.id] !== undefined
															? row.assessmentMarks[assessment.id]
															: '-'}
													</Table.Td>
												))}
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</ScrollArea>
						</Accordion.Panel>
					</Accordion.Item>
				)}
			</Accordion>
		</Stack>
	);
}

function parseExcelData(
	excelData: ExcelData,
	assessments: AssessmentInfo[],
	mapping: ColumnMapping,
	registeredStudents: Array<{ stdNo: number; studentModuleId: number }>
): ParsedRow[] {
	const studentNumberColIndex = mapping.studentNumberColumn
		? columnLetterToIndex(mapping.studentNumberColumn)
		: -1;

	const assessmentColIndices: Record<number, number> = {};
	for (const [assessmentId, column] of Object.entries(
		mapping.assessmentColumns
	)) {
		assessmentColIndices[parseInt(assessmentId, 10)] =
			columnLetterToIndex(column);
	}

	const registeredStudentMap = new Map(
		registeredStudents.map((s) => [s.stdNo.toString(), s.studentModuleId])
	);

	return excelData.rows
		.map((row, index) => {
			const errors: string[] = [];
			let studentNumber = '';
			const assessmentMarks: Record<number, number> = {};

			if (studentNumberColIndex >= 0) {
				const normalizedStudentNumber = normalizeStudentNumber(
					row[studentNumberColIndex]
				);
				if (normalizedStudentNumber) {
					studentNumber = normalizedStudentNumber;
				}
			} else {
				errors.push('Student number column not mapped');
			}

			for (const assessment of assessments) {
				const colIndex = assessmentColIndices[assessment.id];
				if (colIndex >= 0 && colIndex < row.length) {
					const mark = parseNumericValue(row[colIndex]);
					if (mark !== null) {
						if (mark >= 0 && mark <= assessment.totalMarks) {
							assessmentMarks[assessment.id] = mark;
						} else {
							errors.push(
								`Marks for ${getAssessmentTypeLabel(assessment.assessmentType)} is out of range. Expected value between 0 and ${assessment.totalMarks}, but received ${mark}`
							);
						}
					}
				}
			}

			const studentModuleId = studentNumber
				? registeredStudentMap.get(studentNumber)
				: undefined;
			const isRegistered = studentModuleId !== undefined;

			return {
				rowIndex: index,
				studentNumber,
				studentModuleId,
				assessmentMarks,
				isValid: errors.length === 0 && studentNumber !== '',
				isRegistered,
				errors,
			};
		})
		.filter((row) => row.studentNumber !== '');
}

function shorten(name: string) {
	const names = name.split(' ');
	return names.map((n) => n.slice(0, 3)).join(' ');
}
