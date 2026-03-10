'use client';

import {
	ActionIcon,
	Button,
	Divider,
	FileButton,
	Group,
	Paper,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { getStudent, getStudentPhoto } from '@registry/students';
import { IconFile, IconPaperclip, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import RichTextField from '@/shared/ui/adease/RichTextField';
import StudentInput from '@/shared/ui/StudentInput';
import StudentPreviewCard from '../../_components/StudentPreviewCard';
import { VISIBILITY_HINT, VISIBILITY_OPTIONS } from '../_lib/constants';
import { type NoteVisibility, noteVisibility } from '../_schema/studentNotes';
import { createStudentNote, uploadNoteAttachment } from '../_server/actions';

type Props = {
	title?: string;
};

type FormValues = {
	stdNo: number | '';
	content: string;
	visibility: NoteVisibility;
};

const schema = z.object({
	stdNo: z.coerce.number().int().positive('Student is required'),
	content: z
		.string()
		.trim()
		.refine((value) => value.length > 0 && value !== '<p></p>', {
			message: 'Content is required',
		}),
	visibility: z.enum(noteVisibility.enumValues),
});

const defaultValues: FormValues = {
	stdNo: '',
	content: '',
	visibility: 'role',
};

export default function StudentNoteForm({ title }: Props) {
	const router = useRouter();
	const [selectedStdNo, setSelectedStdNo] = useState<number | null>(null);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
		if (file) setPendingFiles((prev) => [...prev, file]);
	}

	function removePendingFile(index: number) {
		setPendingFiles((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleSubmit(values: FormValues) {
		const stdNo = Number(values.stdNo);
		if (!stdNo) throw new Error('Please select a student');

		const created = await createStudentNote(
			stdNo,
			values.content,
			values.visibility
		);
		for (const file of pendingFiles) {
			const formData = new FormData();
			formData.append('file', file);
			await uploadNoteAttachment(stdNo, created.id, formData);
		}

		return created;
	}

	return (
		<Form
			title={title}
			action={handleSubmit}
			queryKey={['student-notes']}
			schema={schema}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				setPendingFiles([]);
				router.push(`/registry/student-notes/${id}`);
			}}
		>
			{(form) => (
				<>
					<StudentInput
						value={form.values.stdNo}
						onChange={(value) => {
							const stdNo = Number(value);
							form.setFieldValue('stdNo', value === '' ? '' : stdNo);
							setSelectedStdNo(stdNo > 0 ? stdNo : null);
						}}
						error={form.errors.stdNo}
						required
					/>

					{selectedStudent && (
						<StudentPreviewCard
							student={selectedStudent}
							photoUrl={photoUrl}
							mt='xs'
						/>
					)}

					{selectedStdNo && (
						<>
							<RichTextField
								toolbar='normal'
								placeholder='Write a note...'
								value={form.values.content}
								onChange={(value) => form.setFieldValue('content', value)}
								height={280}
								showFullScreenButton={false}
							/>
							{form.errors.content && (
								<Text size='xs' c='red'>
									{form.errors.content}
								</Text>
							)}

							<Stack gap={4}>
								<Text size='sm' fw={500}>
									Visibility
								</Text>
								<SegmentedControl
									size='xs'
									data={VISIBILITY_OPTIONS}
									value={form.values.visibility}
									onChange={(value) =>
										form.setFieldValue('visibility', value as NoteVisibility)
									}
								/>
								<Text size='xs' c='dimmed'>
									{VISIBILITY_HINT[form.values.visibility]}
								</Text>
							</Stack>

							<Stack gap='xs'>
								<Divider
									label={
										<Text size='xs' c='dimmed'>
											Attachments
										</Text>
									}
									labelPosition='left'
								/>
								<Group gap='xs' align='center'>
									<FileButton
										onChange={addPendingFile}
										accept='application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
									>
										{(props) => (
											<Button
												{...props}
												variant='default'
												size='xs'
												leftSection={<IconPaperclip size={12} />}
											>
												Add Attachment
											</Button>
										)}
									</FileButton>
									{pendingFiles.length === 0 && (
										<Text size='xs' c='dimmed'>
											No attachments yet
										</Text>
									)}
								</Group>

								{pendingFiles.length > 0 && (
									<SimpleGrid cols={{ base: 1, sm: 2 }}>
										{pendingFiles.map((file, i) => (
											<Paper key={`${file.name}-${i}`} p='md' withBorder>
												<Group justify='space-between'>
													<Group gap='xs'>
														<IconFile
															size={14}
															style={{ color: 'var(--mantine-color-dimmed)' }}
														/>
														<Text size='xs'>{file.name}</Text>
													</Group>
													<ActionIcon
														size='xs'
														variant='subtle'
														color='red'
														onClick={() => removePendingFile(i)}
													>
														<IconX size={12} />
													</ActionIcon>
												</Group>
											</Paper>
										))}
									</SimpleGrid>
								)}
							</Stack>
						</>
					)}
				</>
			)}
		</Form>
	);
}
