'use client';
import { getAssessmentTypeLabel } from '@academic/assessments';
import {
	Center,
	CloseButton,
	Group,
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	UnstyledButton,
} from '@mantine/core';
import {
	IconChevronDown,
	IconChevronUp,
	IconSearch,
	IconSelector,
} from '@tabler/icons-react';
import React, { useState } from 'react';
import Link from '@/shared/ui/Link';
import {
	useAssessmentMarksQuery,
	useAssessmentsQuery,
	useModuleGradesQuery,
} from '../hooks/useAssessmentsQuery';
import { type Student, useStudentsQuery } from '../hooks/useStudentsQuery';
import GradeDisplay from './GradeDisplay';
import GradeSymbolModal from './GradeSymbolModal';
import ExcelImport from './import/ExcelImport';
import MarksAuditModal from './MarksAuditModal';
import MarksInput from './MarksInput';

type Props = {
	moduleId: number;
	semesterModuleIds: number[];
};

interface ThProps {
	children: React.ReactNode;
	reversed: boolean;
	sorted: boolean;
	onSort(): void;
	style?: React.CSSProperties;
}

function Th({ children, reversed, sorted, onSort, style }: ThProps) {
	const Icon = sorted
		? reversed
			? IconChevronUp
			: IconChevronDown
		: IconSelector;
	return (
		<Table.Th style={style}>
			<UnstyledButton onClick={onSort} style={{ width: '100%' }}>
				<Group justify='space-between' gap='xs' wrap='nowrap'>
					<Text fw={500} fz='sm'>
						{children}
					</Text>
					<Center>
						<Icon size={14} stroke={1.5} />
					</Center>
				</Group>
			</UnstyledButton>
		</Table.Th>
	);
}

function sortData(
	data: Student[],
	payload: { sortBy: keyof Student | null; reversed: boolean; search: string }
) {
	const { sortBy, reversed, search } = payload;

	if (!sortBy) {
		return data.filter((item) => {
			const name = String(item.name).toLowerCase();
			const stdNo = String(item.stdNo).toLowerCase();
			const lowerSearch = search.toLowerCase();
			return name.includes(lowerSearch) || stdNo.includes(lowerSearch);
		});
	}

	return [...data]
		.filter((item) => {
			const name = String(item.name).toLowerCase();
			const stdNo = String(item.stdNo).toLowerCase();
			const lowerSearch = search.toLowerCase();
			return name.includes(lowerSearch) || stdNo.includes(lowerSearch);
		})
		.sort((a, b) => {
			const aValue = a[sortBy];
			const bValue = b[sortBy];

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return reversed ? bValue - aValue : aValue - bValue;
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return reversed
					? bValue.localeCompare(aValue)
					: aValue.localeCompare(bValue);
			}
			const aStr = String(aValue).toLowerCase();
			const bStr = String(bValue).toLowerCase();
			return reversed ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
		});
}

export default function StudentTable({ moduleId, semesterModuleIds }: Props) {
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<keyof Student | null>(null);
	const [reverseSortDirection, setReverseSortDirection] = useState(false);

	const { data: studentsData, isLoading: studentsLoading } = useStudentsQuery({
		semesterModuleIds,
		searchQuery: '',
	});

	const setSorting = (field: keyof Student) => {
		const reversed = field === sortBy ? !reverseSortDirection : false;
		setReverseSortDirection(reversed);
		setSortBy(field);
	};

	const sortedStudents = studentsData
		? sortData(studentsData, {
				sortBy,
				reversed: reverseSortDirection,
				search: searchQuery,
			})
		: [];

	const { data: assessments, isLoading: assessmentsLoading } =
		useAssessmentsQuery(moduleId);
	const { data: assessmentMarks } = useAssessmentMarksQuery(moduleId);
	const { data: moduleGrades, isLoading: moduleGradesLoading } =
		useModuleGradesQuery(moduleId);

	const getStudentMark = (studentModuleId: number, assessmentId: number) => {
		if (!assessmentMarks) return { mark: undefined, markId: undefined };

		const mark = assessmentMarks.find(
			(mark) =>
				mark.studentModuleId === studentModuleId &&
				mark.assessmentId === assessmentId
		);

		return {
			mark: mark ? mark.marks : undefined,
			markId: mark ? mark.id : undefined,
		};
	};

	const getStudentGrade = (studentModuleId: number) => {
		if (!moduleGrades) return null;
		return moduleGrades.find((grade) => grade.id === studentModuleId) || null;
	};

	function renderTableHeaders() {
		return (
			<Table.Tr>
				<Th
					sorted={sortBy === 'stdNo'}
					reversed={reverseSortDirection}
					onSort={() => setSorting('stdNo')}
				>
					No.
				</Th>
				<Th
					sorted={sortBy === 'name'}
					reversed={reverseSortDirection}
					onSort={() => setSorting('name')}
				>
					Name
				</Th>
				{assessmentsLoading
					? Array.from({ length: 2 }, (_, idx) => `skeleton-header-${idx}`).map(
							(key) => (
								<Table.Th key={key}>
									<Skeleton height={16} width={80} mx='auto' />
								</Table.Th>
							)
						)
					: assessments?.map((assessment) => (
							<Table.Th
								key={assessment.id}
								style={{ minWidth: '100px', textAlign: 'center' }}
							>
								<Group gap={5} justify='center'>
									<Text size='sm' fw={'bold'}>
										{getAssessmentTypeLabel(assessment.assessmentType)}
									</Text>
									<Text size='xs' c='dimmed'>
										({assessment.weight}%)
									</Text>
								</Group>
							</Table.Th>
						))}
				{assessments && assessments.length > 0 && (
					<>
						<Table.Th style={{ textAlign: 'center' }}>
							<Group gap={5} justify='center'>
								<Text size='sm' fw={'bold'}>
									Total
								</Text>
								<Text size='xs' c='dimmed'>
									(
									{assessments.reduce(
										(acc, assessment) => acc + assessment.weight,
										0
									)}
									%)
								</Text>
							</Group>
						</Table.Th>
						<Table.Th style={{ textAlign: 'center' }}></Table.Th>
					</>
				)}
			</Table.Tr>
		);
	}

	function renderTableRows() {
		if (studentsLoading && !sortedStudents.length) {
			return Array.from(
				{ length: 5 },
				(_, index) => `skeleton-row-${index}`
			).map((rowKey) => (
				<Table.Tr key={rowKey}>
					<Table.Td>
						<Skeleton height={20} width={100} />
					</Table.Td>
					<Table.Td>
						<Skeleton height={20} width={150} />
					</Table.Td>
					{assessmentsLoading || !assessments
						? Array.from(
								{ length: 2 },
								(_, idx) => `${rowKey}-cell-${idx}`
							).map((cellKey) => (
								<Table.Td key={cellKey}>
									<Skeleton height={24} width={80} mx='auto' />
								</Table.Td>
							))
						: assessments.map((assessment) => (
								<Table.Td key={`${rowKey}-assessment-${assessment.id}`}>
									<Skeleton height={24} width={80} mx='auto' />
								</Table.Td>
							))}
					{(assessmentsLoading || (assessments && assessments.length > 0)) && (
						<React.Fragment>
							<Table.Td>
								<Skeleton height={24} width={80} mx='auto' />
							</Table.Td>
							<Table.Td>
								<Skeleton height={24} width={80} mx='auto' />
							</Table.Td>
						</React.Fragment>
					)}
				</Table.Tr>
			));
		}

		if (!sortedStudents || sortedStudents.length === 0) {
			return (
				<Table.Tr>
					<Table.Td colSpan={assessments ? assessments.length + 4 : 4}>
						<Center p='md'>
							<Text>
								{searchQuery
									? 'No students match your search.'
									: 'No students found.'}
							</Text>
						</Center>
					</Table.Td>
				</Table.Tr>
			);
		}

		return sortedStudents.map((student) => {
			return (
				<Table.Tr key={student.stdNo}>
					<Table.Td>
						<Link size='sm' href={`/registry/students/${student.stdNo}`}>
							{student.stdNo}
						</Link>
					</Table.Td>
					<Table.Td>{student.name}</Table.Td>
					{assessmentsLoading
						? Array(3)
								.fill(0)
								.map((_, idx) => (
									<Table.Td key={`skeleton-student-${student.stdNo}-${idx}`}>
										<Skeleton height={24} width={80} mx='auto' />
									</Table.Td>
								))
						: assessments?.map((assessment) => {
								const { mark, markId } = getStudentMark(
									student.studentModuleId,
									assessment.id
								);
								return (
									<Table.Td
										key={`${student.stdNo}-${assessment.id}`}
										align='center'
									>
										<MarksInput
											assessment={{
												id: assessment.id,
												maxMarks: assessment.totalMarks,
												totalMarks: assessment.totalMarks,
											}}
											studentModuleId={student.studentModuleId}
											existingMark={mark}
											existingMarkId={markId}
											moduleId={moduleId}
										/>
									</Table.Td>
								);
							})}
					{assessments && assessments.length > 0 && (
						<>
							<Table.Td align='center'>
								<Group gap='xs' justify='center' wrap='nowrap'>
									<GradeDisplay
										studentModuleId={student.studentModuleId}
										displayType='total'
										moduleId={moduleId}
										moduleGrade={getStudentGrade(student.studentModuleId)}
										isLoading={moduleGradesLoading}
									/>
									<GradeDisplay
										studentModuleId={student.studentModuleId}
										displayType='grade'
										moduleId={moduleId}
										moduleGrade={getStudentGrade(student.studentModuleId)}
										isLoading={moduleGradesLoading}
									/>
								</Group>
							</Table.Td>
							<Table.Td align='center'>
								<Group gap={3} justify='center' wrap='nowrap'>
									<MarksAuditModal
										studentModuleId={student.studentModuleId}
										studentName={student.name}
									/>
									<GradeSymbolModal
										studentModuleId={student.studentModuleId}
										stdNo={student.stdNo}
										studentName={student.name}
										moduleId={moduleId}
										currentGrade={
											getStudentGrade(student.studentModuleId)?.grade
										}
										weightedTotal={
											getStudentGrade(student.studentModuleId)?.weightedTotal
										}
									/>
								</Group>
							</Table.Td>
						</>
					)}
				</Table.Tr>
			);
		});
	}
	return (
		<Stack>
			<Group justify='space-between' align='center' wrap='nowrap'>
				<TextInput
					placeholder='Search by name or student number'
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.currentTarget.value)}
					style={{ flex: 1 }}
					rightSection={
						searchQuery ? (
							<CloseButton
								onClick={() => setSearchQuery('')}
								variant='subtle'
								size='sm'
							/>
						) : null
					}
					leftSection={<IconSearch size='1.2rem' />}
				/>{' '}
				<Group>
					{assessments && assessments.length > 0 && (
						<ExcelImport
							moduleId={moduleId}
							semesterModuleIds={semesterModuleIds}
							assessments={assessments.map((assessment) => ({
								id: assessment.id,
								assessmentType: assessment.assessmentType,
								assessmentNumber: assessment.assessmentNumber,
								totalMarks: assessment.totalMarks,
								weight: assessment.weight,
							}))}
						/>
					)}
					{!studentsLoading && studentsData && (
						<Paper withBorder p={8.5}>
							<Text size='xs' c='dimmed' style={{ whiteSpace: 'nowrap' }}>
								{sortedStudents.length} student
								{sortedStudents.length !== 1 ? 's' : ''} displayed
							</Text>
						</Paper>
					)}
				</Group>
			</Group>

			<Table highlightOnHover withTableBorder>
				<Table.Thead>{renderTableHeaders()}</Table.Thead>
				<Table.Tbody>{renderTableRows()}</Table.Tbody>
			</Table>
		</Stack>
	);
}
