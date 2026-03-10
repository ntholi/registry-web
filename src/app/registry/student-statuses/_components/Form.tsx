'use client';

import {
	Avatar,
	Box,
	Group,
	Paper,
	Select,
	SimpleGrid,
	Text,
	Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { studentStatuses } from '@registry/_database';
import { getStudent, getStudentPhoto } from '@registry/students';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	type AttachmentItem,
	AttachmentManager,
	Form,
} from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';
import TermInput from '@/shared/ui/TermInput';
import { ALLOWED_MIME_TYPES, MAX_ATTACHMENT_SIZE } from '../_lib/constants';
import { getJustificationLabel, getTypeLabel } from '../_lib/labels';
import { uploadStudentStatusAttachment } from '../_server/actions';

type StudentStatusInsert = typeof studentStatuses.$inferInsert;
type StatusType = (typeof studentStatuses.type.enumValues)[number];
type StudentData = Awaited<ReturnType<typeof getStudent>>;
type StudentSemesterData =
	NonNullable<StudentData>['programs'][number]['semesters'][number];
type DraftAttachment = AttachmentItem & { file: File };

type Props = {
	onSubmit: (values: StudentStatusInsert) => Promise<{ id: string }>;
	defaultValues?: StudentStatusInsert;
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

function releaseAttachmentUrls(items: DraftAttachment[]) {
	for (const attachment of items) {
		if (attachment.fileUrl?.startsWith('blob:')) {
			URL.revokeObjectURL(attachment.fileUrl);
		}
	}
}

export default function StudentStatusForm({
	onSubmit,
	defaultValues,
	title,
	mode = 'create',
}: Props) {
	const router = useRouter();
	const isEdit = mode === 'edit';
	const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
	const [validStudentNo, setValidStudentNo] = useState(
		!!defaultValues?.stdNo && String(defaultValues.stdNo).length === 9
	);
	const [selectedStdNo, setSelectedStdNo] = useState<number | null>(
		defaultValues?.stdNo ? Number(defaultValues.stdNo) : null
	);
	const [selectedType, setSelectedType] = useState<StatusType | null>(
		defaultValues?.type ?? null
	);

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

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['student-statuses']}
			schema={schema}
			defaultValues={defaultValues}
			onSuccess={async ({ id }) => {
				if (attachments.length > 0) {
					const results = await Promise.allSettled(
						attachments.map((attachment) => {
							const formData = new FormData();
							formData.append('file', attachment.file);
							return uploadStudentStatusAttachment(id, formData);
						})
					);

					releaseAttachmentUrls(attachments);
					setAttachments([]);

					const failedUploads = results.filter(
						(result): result is PromiseRejectedResult =>
							result.status === 'rejected'
					);

					if (failedUploads.length > 0) {
						const errorMessages = failedUploads
							.map((result) => result.reason)
							.filter((reason): reason is Error => reason instanceof Error)
							.map((reason) => reason.message)
							.filter(Boolean);

						notifications.show({
							title: 'Partial Upload',
							message: errorMessages.length
								? `Application created, but ${failedUploads.length} attachment(s) failed to upload: ${errorMessages.join('; ')}`
								: 'Application created, but some attachments failed to upload. You can retry from the details page.',
							color: 'yellow',
						});
					}
				}

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
							<Paper withBorder p='sm' mt='xs' radius='md' bg='transparent'>
								<Group gap='sm'>
									<Avatar
										size={46}
										radius='xl'
										src={photoUrl ?? undefined}
										color='blue'
									>
										<IconUser size={22} />
									</Avatar>
									<Box>
										<Text fw={600} size='sm'>
											{selectedStudent.name}
										</Text>
										<Text size='xs' c='dimmed'>
											{selectedStudent.stdNo}
										</Text>
									</Box>
								</Group>
							</Paper>
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
										<Textarea
											label='Notes'
											autosize
											minRows={3}
											{...form.getInputProps('notes')}
										/>
										{!isEdit && (
											<AttachmentManager
												attachments={attachments}
												canEdit
												accept={ALLOWED_MIME_TYPES}
												maxSize={MAX_ATTACHMENT_SIZE}
												onUpload={async (file) => {
													const nextAttachment: DraftAttachment = {
														id: `${file.name}-${file.size}-${file.lastModified}`,
														fileName: file.name,
														fileKey: null,
														fileUrl: URL.createObjectURL(file),
														fileSize: file.size,
														mimeType: file.type || null,
														file,
													};
													setAttachments((current) => [
														...current,
														nextAttachment,
													]);
													return nextAttachment;
												}}
												onDelete={async (id) => {
													setAttachments((current) => {
														const found = current.find(
															(attachment) => attachment.id === id
														);
														if (found?.fileUrl?.startsWith('blob:')) {
															URL.revokeObjectURL(found.fileUrl);
														}
														return current.filter(
															(attachment) => attachment.id !== id
														);
													});
												}}
												uploadSuccessMessage='Attachment added'
												deleteSuccessMessage='Attachment removed'
											/>
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
