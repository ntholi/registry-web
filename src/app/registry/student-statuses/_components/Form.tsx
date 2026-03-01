'use client';

import { Select, Textarea, TextInput } from '@mantine/core';
import { studentStatuses } from '@registry/_database';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { Form } from '@/shared/ui/adease';
import { getJustificationLabel, getTypeLabel } from '../_lib/labels';

type StudentStatusInsert = typeof studentStatuses.$inferInsert;
type StatusType = (typeof studentStatuses.type.enumValues)[number];

type Props = {
	onSubmit: (values: StudentStatusInsert) => Promise<{ id: number }>;
	defaultValues?: StudentStatusInsert;
	title?: string;
	mode?: 'create' | 'edit';
};

const schema = createInsertSchema(studentStatuses).omit({
	status: true,
	createdBy: true,
	createdAt: true,
	updatedAt: true,
});

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
	const { activeTerm } = useActiveTerm();
	const isEdit = mode === 'edit';
	const [validStudentNo, setValidStudentNo] = useState(
		!!defaultValues?.stdNo && String(defaultValues.stdNo).length === 9
	);
	const [selectedType, setSelectedType] = useState<StatusType | null>(
		defaultValues?.type ?? null
	);

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['student-statuses']}
			schema={schema}
			defaultValues={{
				...defaultValues,
				termCode: defaultValues?.termCode ?? activeTerm?.code ?? '',
			}}
			onSuccess={({ id }) => {
				router.push(`/registry/student-statuses/${id}`);
			}}
		>
			{(form) => {
				const handleStdNoChange = (value: number | string) => {
					form.setFieldValue('stdNo', value as number);
					const strValue = String(value);
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
						<StdNoInput
							{...form.getInputProps('stdNo')}
							onChange={handleStdNoChange}
							disabled={isEdit}
						/>

						{validStudentNo && (
							<>
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

								{selectedType && (
									<>
										<Select
											label='Justification'
											required
											data={getJustificationOptions(selectedType)}
											{...form.getInputProps('justification')}
										/>

										<TextInput
											label='Term Code'
											required
											placeholder='YYYY-MM'
											{...form.getInputProps('termCode')}
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
