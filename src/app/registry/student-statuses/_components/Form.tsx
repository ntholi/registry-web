'use client';

import { Anchor, Group, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import { studentStatuses } from '@registry/_database';
import { getStudent, getStudentPhoto } from '@registry/students';
import ReasonsTab from '@registry/students/_components/shared/ReasonsTab';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import {
	type ActionResult,
	isActionResult,
	unwrap,
} from '@/shared/lib/actions/actionResult';
import { isRichTextEmpty } from '@/shared/lib/utils/files';
import { formatSemester } from '@/shared/lib/utils/utils';
import { Form } from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';
import TermInput from '@/shared/ui/TermInput';
import StudentPreviewCard from '../../_components/StudentPreviewCard';
import { getJustificationLabel, getTypeLabel } from '../_lib/labels';
import type { StudentStatusAttachment } from '../_lib/types';
import {
	deleteStudentStatusAttachment,
	uploadStudentStatusAttachment,
} from '../_server/actions';

type StudentStatusInsert = typeof studentStatuses.$inferInsert;
type StatusType = (typeof studentStatuses.type.enumValues)[number];
type StudentData = Awaited<ReturnType<typeof getStudent>>;
type StudentSemesterData =
	NonNullable<StudentData>['programs'][number]['semesters'][number];

type Props = {
	onSubmit: (
		values: StudentStatusInsert
	) => Promise<{ id: string } | ActionResult<{ id: string }>>;
	defaultValues?: StudentStatusInsert & {
		attachments?: StudentStatusAttachment[];
	};
	title?: string;
	mode?: 'create' | 'edit';
};

const schema = createInsertSchema(studentStatuses)
	.omit({
		status: true,
		createdBy: true,
		createdAt: true,
		updatedAt: true,
		termCode: true,
	})
	.extend({ termId: z.number() });

const withdrawalJustifications = [
	'medical',
	'transfer',
	'financial',
	'employment',
	'other',
] as const;

const reinstatementJustifications = [
	'after_withdrawal',
	'after_deferment',
	'failed_modules',
	'upgrading',
	'other',
] as const;

function getJustificationOptions(type: StatusType | null) {
	const items =
		type === 'reinstatement'
			? reinstatementJustifications
			: withdrawalJustifications;
	return items.map((v) => ({ value: v, label: getJustificationLabel(v) }));
}

function semesterSortValue(semester: StudentSemesterData) {
	return Number(semester.structureSemester?.semesterNumber ?? '0');
}

function getSemesterOptions(student: StudentData | undefined) {
	if (!student) return [];

	return student.programs
		.flatMap((program) => program.semesters)
		.sort((left, right) => {
			const byTerm = right.termCode.localeCompare(left.termCode);
			if (byTerm !== 0) return byTerm;

			const bySemester = semesterSortValue(right) - semesterSortValue(left);
			if (bySemester !== 0) return bySemester;

			return right.id - left.id;
		})
		.map((semester) => ({
			value: String(semester.id),
			id: semester.id,
			label: formatSemester(semester.structureSemester?.semesterNumber, 'mini'),
		}));
}

export default function StudentStatusForm({
	onSubmit,
	defaultValues,
	title,
	mode = 'create',
}: Props) {
	const router = useRouter();
	const isEdit = mode === 'edit';
	const [validStudentNo, setValidStudentNo] = useState(
		!!defaultValues?.stdNo && String(defaultValues.stdNo).length === 9
	);
	const [selectedStdNo, setSelectedStdNo] = useState<number | null>(
		defaultValues?.stdNo ? Number(defaultValues.stdNo) : null
	);
	const [selectedType, setSelectedType] = useState<StatusType | null>(
		defaultValues?.type ?? null
	);
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

	const { data: selectedStudent } = useQuery({
		queryKey: ['student', selectedStdNo],
		queryFn: () => getStudent(selectedStdNo!),
		enabled: !!selectedStdNo,
	});

	const { data: photoUrl } = useQuery({
		queryKey: ['student-photo', selectedStdNo],
		queryFn: () => getStudentPhoto(selectedStdNo),
		enabled: !!selectedStdNo,
	});

	function addPendingFile(file: File | null) {
		if (file) {
			setFilesToUpload((prev) => [...prev, file]);
		}
	}

	function removePendingFile(index: number) {
		setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleSubmit(values: StudentStatusInsert) {
		const result = await onSubmit({
			...values,
			reasons: isRichTextEmpty(values.reasons ?? '') ? null : values.reasons,
		});
		const data = isActionResult(result) ? unwrap(result) : result;
		const uploadedAttachments: StudentStatusAttachment[] = [];

		try {
			for (const file of filesToUpload) {
				const formData = new FormData();
				formData.append('file', file);
				uploadedAttachments.push(
					unwrap(await uploadStudentStatusAttachment(data.id, formData))
				);
			}
		} catch (error) {
			await Promise.allSettled(
				uploadedAttachments.map((attachment) =>
					deleteStudentStatusAttachment(attachment.id)
				)
			);
			throw error;
		}

		return data;
	}

	return (
		<Form
			title={title}
			action={handleSubmit}
			queryKey={['student-statuses']}
			schema={schema}
			defaultValues={{
				...defaultValues,
				reasons: defaultValues?.reasons ?? '',
			}}
			onSuccess={({ id }) => {
				setFilesToUpload([]);
				router.push(`/registry/student-statuses/${id}`);
			}}
		>
			{(form) => {
				const semesterOptions = getSemesterOptions(selectedStudent);
				const latestSemesterId = semesterOptions[0]?.id;

				const handleStdNoChange = (value: number | string) => {
					form.setFieldValue('stdNo', value as number);
					form.setFieldValue('semesterId', undefined);
					const strValue = String(value);
					const stdNo = Number(value);
					setSelectedStdNo(stdNo > 0 ? stdNo : null);
					setValidStudentNo(
						strValue.length === 9 && strValue.startsWith('9010')
					);
				};

				const handleTypeChange = (value: string | null) => {
					const typed = value as StatusType | null;
					setSelectedType(typed);
					form.setFieldValue('type', typed as StatusType);
					const options = getJustificationOptions(typed);
					form.setFieldValue('justification', options[0].value);
					if (!form.values.semesterId && latestSemesterId) {
						form.setFieldValue('semesterId', latestSemesterId);
					}
				};

				const semesterRequired =
					selectedType === 'withdrawal' || selectedType === 'deferment';

				return (
					<>
						<StudentInput
							{...form.getInputProps('stdNo')}
							onChange={handleStdNoChange}
							disabled={isEdit}
						/>

						{selectedStudent && (
							<StudentPreviewCard
								student={selectedStudent}
								photoUrl={photoUrl}
								mt='xs'
							/>
						)}

						{validStudentNo && (
							<>
								<SimpleGrid cols={2} spacing='md'>
									<Select
										label='Type'
										required
										disabled={isEdit}
										data={studentStatuses.type.enumValues.map((v) => ({
											value: v,
											label: getTypeLabel(v),
										}))}
										{...form.getInputProps('type')}
										onChange={isEdit ? undefined : handleTypeChange}
									/>
									<Select
										label='Justification'
										required
										disabled={!selectedType}
										data={getJustificationOptions(selectedType)}
										{...form.getInputProps('justification')}
									/>
								</SimpleGrid>

								{selectedType && (
									<>
										<SimpleGrid cols={2} spacing='md'>
											<TermInput
												required
												value={form.values.termId}
												onChange={(value) =>
													form.setFieldValue(
														'termId',
														typeof value === 'number' ? value : undefined
													)
												}
												error={form.errors.termId}
											/>
											<Select
												label='Semester'
												required={semesterRequired}
												placeholder='Select semester'
												data={semesterOptions}
												value={
													form.values.semesterId || latestSemesterId
														? String(form.values.semesterId ?? latestSemesterId)
														: null
												}
												onChange={(value) =>
													form.setFieldValue(
														'semesterId',
														typeof value === 'string'
															? Number(value)
															: undefined
													)
												}
												error={form.errors.semesterId}
												disabled={semesterOptions.length === 0}
											/>
										</SimpleGrid>
										<ReasonsTab
											reasons={form.values.reasons ?? ''}
											onReasonsChange={(value) =>
												form.setFieldValue('reasons', value)
											}
											pendingFiles={filesToUpload}
											onAddFile={addPendingFile}
											onRemoveFile={removePendingFile}
										/>
										{defaultValues?.attachments &&
											defaultValues.attachments.length > 0 && (
												<Stack gap='xs'>
													<Text size='sm' fw={500}>
														Current Attachments
													</Text>
													{defaultValues.attachments.map((attachment) => (
														<Anchor
															key={attachment.id}
															href={getPublicUrl(attachment.fileKey)}
															target='_blank'
															size='sm'
														>
															<Group gap={6}>{attachment.fileName}</Group>
														</Anchor>
													))}
												</Stack>
											)}
									</>
								)}
							</>
						)}
					</>
				);
			}}
		</Form>
	);
}
