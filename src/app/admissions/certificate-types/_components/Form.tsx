'use client';

import { certificateTypes, standardGradeEnum } from '@admissions/_database';
import {
	ActionIcon,
	Alert,
	Group,
	NumberInput,
	Select,
	Stack,
	Table,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type { CertificateTypeWithMappings } from '../_lib/types';

type GradeMappingInput = {
	originalGrade: string;
	standardGrade: (typeof standardGradeEnum.enumValues)[number];
};

type FormValues = typeof certificateTypes.$inferInsert & {
	gradeMappings?: GradeMappingInput[];
};

type Props = {
	onSubmit: (values: FormValues) => Promise<CertificateTypeWithMappings>;
	defaultValues?: CertificateTypeWithMappings;
	title?: string;
};

const standardGradeOptions = standardGradeEnum.enumValues.map((grade) => ({
	value: grade,
	label: grade,
}));

export default function CertificateTypeForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	const schema = z.object({
		...createInsertSchema(certificateTypes).shape,
		lqfLevel: z.coerce.number().min(4, 'LQF level must be 4 or higher'),
		gradeMappings: z
			.array(
				z.object({
					originalGrade: z.string().min(1, 'Original grade is required'),
					standardGrade: z.enum(standardGradeEnum.enumValues),
				})
			)
			.optional(),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['certificate-types']}
			schema={schema}
			defaultValues={
				defaultValues
					? {
							...defaultValues,
							gradeMappings: defaultValues.gradeMappings?.map((m) => ({
								originalGrade: m.originalGrade,
								standardGrade: m.standardGrade,
							})),
						}
					: { lqfLevel: 4, gradeMappings: [] }
			}
			onSuccess={({ id }) => router.push(`/admissions/certificate-types/${id}`)}
		>
			{(form) => (
				<>
					<TextInput
						label='Name'
						placeholder='e.g., LGCSE, COSC, Matric'
						required
						{...form.getInputProps('name')}
					/>
					<Textarea
						label='Description'
						placeholder='Brief description of this certificate type'
						{...form.getInputProps('description')}
					/>
					<NumberInput
						label='LQF Level'
						description='Lesotho Qualifications Framework level (minimum 4)'
						min={4}
						max={10}
						required
						{...form.getInputProps('lqfLevel')}
					/>

					{form.values.lqfLevel === 4 ? (
						<GradeMappingEditor form={form} />
					) : (
						<Alert
							icon={<IconInfoCircle size={16} />}
							title='Level 5+ Certificates'
							color='blue'
						>
							<Text size='sm'>
								Level 5 and above certificates use result classifications
								(Distinction, Merit, Credit, Pass, Fail) instead of
								subject-based grades. No grade mapping is required.
							</Text>
						</Alert>
					)}
				</>
			)}
		</Form>
	);
}

type GradeMappingEditorProps = {
	// biome-ignore lint/suspicious/noExplicitAny: form type is complex
	form: any;
};

function GradeMappingEditor({ form }: GradeMappingEditorProps) {
	const mappings: GradeMappingInput[] = form.values.gradeMappings || [];

	function addMapping() {
		form.setFieldValue('gradeMappings', [
			...mappings,
			{ originalGrade: '', standardGrade: 'C' as const },
		]);
	}

	function removeMapping(index: number) {
		form.setFieldValue(
			'gradeMappings',
			mappings.filter((_, i) => i !== index)
		);
	}

	return (
		<Stack gap='sm'>
			<Group justify='space-between'>
				<Text fw={500} size='sm'>
					Grade Mappings
				</Text>
				<ActionIcon variant='light' color='blue' onClick={addMapping}>
					<IconPlus size={16} />
				</ActionIcon>
			</Group>

			{mappings.length === 0 ? (
				<Text size='sm' c='dimmed'>
					No grade mappings defined. Click + to add mappings from this
					certificate&apos;s grading system to the standard LGCSE scale.
				</Text>
			) : (
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Original Grade</Table.Th>
							<Table.Th>Standard Grade (LGCSE)</Table.Th>
							<Table.Th w={40} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{mappings.map((_, index) => (
							<Table.Tr key={index}>
								<Table.Td>
									<TextInput
										placeholder='e.g., 1, A, Pass'
										{...form.getInputProps(
											`gradeMappings.${index}.originalGrade`
										)}
									/>
								</Table.Td>
								<Table.Td>
									<Select
										data={standardGradeOptions}
										{...form.getInputProps(
											`gradeMappings.${index}.standardGrade`
										)}
									/>
								</Table.Td>
								<Table.Td>
									<ActionIcon
										variant='subtle'
										color='red'
										onClick={() => removeMapping(index)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Stack>
	);
}
