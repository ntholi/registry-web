'use client';

import { Badge, Divider, Group, Stack, Table, Text } from '@mantine/core';
import type {
	academicRecords,
	certificateTypes,
	gradeMappings,
	subjectGrades,
	subjects,
} from '@/core/database';
import {
	updateAcademicRecordField,
	updateSubjectGradeField,
} from '../_server/actions';
import EditableField from './EditableField';

type SubjectGrade = typeof subjectGrades.$inferSelect & {
	subject: typeof subjects.$inferSelect;
};

type AcademicRecord = typeof academicRecords.$inferSelect & {
	certificateType: typeof certificateTypes.$inferSelect & {
		gradeMappings?: (typeof gradeMappings.$inferSelect)[];
	};
	subjectGrades: SubjectGrade[];
};

type Props = {
	records: AcademicRecord[];
};

const CLASSIFICATION_OPTIONS = [
	{ value: 'Distinction', label: 'Distinction' },
	{ value: 'Merit', label: 'Merit' },
	{ value: 'Credit', label: 'Credit' },
	{ value: 'Pass', label: 'Pass' },
	{ value: 'Fail', label: 'Fail' },
];

export default function AcademicDataPanel({ records }: Props) {
	function getOriginalGradeOptions(record: AcademicRecord) {
		const values = new Set(
			(record.certificateType?.gradeMappings ?? []).map((m) => m.originalGrade)
		);
		return Array.from(values).map((v) => ({ value: v, label: v }));
	}

	function renderSubjectGrades(record: AcademicRecord) {
		if (record.subjectGrades.length === 0) {
			return null;
		}

		const isLqf4 = record.certificateType?.lqfLevel === 4;
		const originalGradeOptions = getOriginalGradeOptions(record);

		return (
			<Stack gap='xs' mt='xs'>
				<Text size='xs' fw={600} c='dimmed' tt='uppercase'>
					Subject Grades
				</Text>
				<Table
					horizontalSpacing='xs'
					verticalSpacing={6}
					fz='sm'
					striped
					highlightOnHover
				>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Subject</Table.Th>
							<Table.Th w={160}>Original Grade</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{record.subjectGrades.map((sg) => (
							<Table.Tr key={sg.id}>
								<Table.Td>
									<Text size='sm'>{sg.subject?.name ?? 'Unknown'}</Text>
								</Table.Td>
								<Table.Td>
									<EditableField
										label='Original Grade'
										hideLabel
										value={sg.originalGrade}
										onSave={async (v) => {
											await updateSubjectGradeField(sg.id, 'originalGrade', v);
										}}
										inputType={
											isLqf4 && originalGradeOptions.length > 0
												? 'select'
												: 'text'
										}
										selectOptions={
											isLqf4 && originalGradeOptions.length > 0
												? originalGradeOptions
												: undefined
										}
										clearable={!isLqf4}
									/>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Stack>
		);
	}

	if (records.length === 0) {
		return (
			<Stack gap='md'>
				<Text size='sm' fw={600} c='dimmed' tt='uppercase' lts={1}>
					Academic Information
				</Text>
				<Divider />
				<Text size='sm' c='dimmed' fs='italic'>
					No academic records linked to this document
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap='lg'>
			{records.map((record, idx) => (
				<Stack key={record.id} gap='md'>
					<Group justify='space-between' align='center'>
						<Text size='sm' fw={600} c='dimmed' tt='uppercase' lts={1}>
							Academic Record {records.length > 1 ? `#${idx + 1}` : ''}
						</Text>
						<Badge variant='light' size='sm'>
							{record.certificateType?.name}
						</Badge>
					</Group>
					<Divider />
					{record.certificateType?.lqfLevel === 4 && (
						<>
							{renderSubjectGrades(record)} <Divider />
						</>
					)}

					<EditableField
						label='Institution Name'
						value={record.institutionName}
						onSave={async (v) => {
							await updateAcademicRecordField(record.id, 'institutionName', v);
						}}
					/>
					<EditableField
						label='Exam Year'
						value={record.examYear?.toString() ?? null}
						onSave={async (v) => {
							await updateAcademicRecordField(
								record.id,
								'examYear',
								v ? Number.parseInt(v, 10) : null
							);
						}}
					/>
					<EditableField
						label='Qualification Name'
						value={record.qualificationName}
						onSave={async (v) => {
							await updateAcademicRecordField(
								record.id,
								'qualificationName',
								v
							);
						}}
					/>
					<EditableField
						label='Certificate Number'
						value={record.certificateNumber}
						onSave={async (v) => {
							await updateAcademicRecordField(
								record.id,
								'certificateNumber',
								v
							);
						}}
					/>
					<EditableField
						label='Candidate Number'
						value={record.candidateNumber}
						onSave={async (v) => {
							await updateAcademicRecordField(record.id, 'candidateNumber', v);
						}}
					/>
					<EditableField
						label='Overall Classification'
						value={record.resultClassification}
						onSave={async (v) => {
							await updateAcademicRecordField(
								record.id,
								'resultClassification',
								v
							);
						}}
						inputType='select'
						selectOptions={CLASSIFICATION_OPTIONS}
					/>
					{record.certificateType?.lqfLevel !== 4 &&
						renderSubjectGrades(record)}
				</Stack>
			))}
		</Stack>
	);
}
