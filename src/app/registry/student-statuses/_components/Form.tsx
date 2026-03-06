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
import { studentStatuses } from '@registry/_database';
import { getStudent, getStudentPhoto } from '@registry/students';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';
import TermInput from '@/shared/ui/TermInput';
import { getJustificationLabel, getTypeLabel } from '../_lib/labels';

type StudentStatusInsert = typeof studentStatuses.$inferInsert;
type StatusType = (typeof studentStatuses.type.enumValues)[number];

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
			onSuccess={({ id }) => {
				router.push(`/registry/student-statuses/${id}`);
			}}
		>
			{(form) => {
				const handleStdNoChange = (value: number | string) => {
					form.setFieldValue('stdNo', value as number);
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
				};

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
										<Textarea
											label='Notes'
											autosize
											minRows={3}
											{...form.getInputProps('notes')}
										/>
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
