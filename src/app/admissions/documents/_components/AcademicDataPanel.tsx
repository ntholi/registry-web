'use client';

import { Badge, Divider, Group, Stack, Table, Text } from '@mantine/core';
import type {
	academicRecords,
	certificateTypes,
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
	certificateType: typeof certificateTypes.$inferSelect;
	subjectGrades: SubjectGrade[];
};

type Props = {
	records: AcademicRecord[];
};

const STANDARD_GRADE_OPTIONS = [
	{ value: 'A*', label: 'A*' },
	{ value: 'A', label: 'A' },
	{ value: 'B', label: 'B' },
	{ value: 'C', label: 'C' },
	{ value: 'D', label: 'D' },
	{ value: 'E', label: 'E' },
	{ value: 'F', label: 'F' },
	{ value: 'U', label: 'U' },
];

const CLASSIFICATION_OPTIONS = [
	{ value: 'Distinction', label: 'Distinction' },
	{ value: 'Merit', label: 'Merit' },
	{ value: 'Credit', label: 'Credit' },
	{ value: 'Pass', label: 'Pass' },
	{ value: 'Fail', label: 'Fail' },
];

export default function AcademicDataPanel({ records }: Props) {
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

					{record.subjectGrades.length > 0 && (
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
										<Table.Th w={120}>Original</Table.Th>
										<Table.Th w={120}>Standard</Table.Th>
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
													label=''
													value={sg.originalGrade}
													onSave={async (v) => {
														await updateSubjectGradeField(
															sg.id,
															'originalGrade',
															v
														);
													}}
												/>
											</Table.Td>
											<Table.Td>
												<EditableField
													label=''
													value={sg.standardGrade}
													onSave={async (v) => {
														await updateSubjectGradeField(
															sg.id,
															'standardGrade',
															v
														);
													}}
													inputType='select'
													selectOptions={STANDARD_GRADE_OPTIONS}
												/>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</Stack>
					)}
				</Stack>
			))}
		</Stack>
	);
}
