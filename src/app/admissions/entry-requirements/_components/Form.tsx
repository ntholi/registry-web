'use client';

import { entryRequirements } from '@admissions/_database';
import type { GradingType } from '@admissions/_database/schema/enums';
import {
	ActionIcon,
	Group,
	NumberInput,
	Paper,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type {
	ClassificationRules,
	EntryRequirement,
	SubjectGradeRules,
} from '../_lib/types';

type Program = { id: number; code: string; name: string };
type CertificateType = {
	id: number;
	name: string;
	lqfLevel: number;
	gradingType: GradingType;
};
type Subject = { id: number; name: string };

type Props = {
	onSubmit: (values: EntryRequirement) => Promise<EntryRequirement>;
	defaultValues?: EntryRequirement;
	title?: string;
	programs: Program[];
	certificateTypes: CertificateType[];
	subjects: Subject[];
};

const standardGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];
const classifications = ['Distinction', 'Merit', 'Credit', 'Pass'] as const;

export default function EntryRequirementForm({
	onSubmit,
	defaultValues,
	title,
	programs,
	certificateTypes,
	subjects,
}: Props) {
	const router = useRouter();
	const [selectedCertType, setSelectedCertType] =
		useState<CertificateType | null>(() => {
			if (defaultValues?.certificateTypeId) {
				return (
					certificateTypes.find(
						(c) => c.id === defaultValues.certificateTypeId
					) || null
				);
			}
			return null;
		});

	const [subjectGradeRules, setSubjectGradeRules] = useState<SubjectGradeRules>(
		() => {
			const rules = defaultValues?.rules as
				| SubjectGradeRules
				| ClassificationRules
				| undefined;
			if (rules?.type === 'subject-grades') return rules;
			return {
				type: 'subject-grades',
				minimumGrades: { count: 5, grade: 'C' },
				requiredSubjects: [],
			};
		}
	);

	const [classificationRules, setClassificationRules] =
		useState<ClassificationRules>(() => {
			const rules = defaultValues?.rules as
				| SubjectGradeRules
				| ClassificationRules
				| undefined;
			if (rules?.type === 'classification') return rules;
			return {
				type: 'classification',
				minimumClassification: 'Credit',
			};
		});

	const schema = z.object({
		...createInsertSchema(entryRequirements).shape,
		programId: z.coerce.number().min(1, 'Program is required'),
		certificateTypeId: z.coerce.number().min(1, 'Certificate type is required'),
	});

	const isSubjectBased = selectedCertType?.gradingType === 'subject-grades';

	const handleSubmit = async (values: EntryRequirement) => {
		const rules = isSubjectBased ? subjectGradeRules : classificationRules;
		return onSubmit({ ...values, rules });
	};

	const addRequiredSubject = () => {
		setSubjectGradeRules((prev) => ({
			...prev,
			requiredSubjects: [
				...prev.requiredSubjects,
				{ subjectId: 0, minimumGrade: 'C' },
			],
		}));
	};

	const removeRequiredSubject = (index: number) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			requiredSubjects: prev.requiredSubjects.filter((_, i) => i !== index),
		}));
	};

	const updateRequiredSubject = (
		index: number,
		field: 'subjectId' | 'minimumGrade',
		value: number | string
	) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			requiredSubjects: prev.requiredSubjects.map((s, i) =>
				i === index ? { ...s, [field]: value } : s
			),
		}));
	};

	return (
		<Form
			title={title}
			action={handleSubmit}
			queryKey={['entry-requirements']}
			schema={schema}
			defaultValues={defaultValues}
			onSuccess={({ id }) =>
				router.push(`/admissions/entry-requirements/${id}`)
			}
		>
			{(form) => (
				<Stack gap='md'>
					<Select
						label='Program'
						placeholder='Select program'
						required
						data={programs.map((p) => ({
							value: p.id.toString(),
							label: `${p.code} - ${p.name}`,
						}))}
						searchable
						{...form.getInputProps('programId')}
						value={form.values.programId?.toString() || ''}
						onChange={(val) =>
							form.setFieldValue('programId', val ? Number(val) : 0)
						}
					/>

					<Select
						label='Certificate Type'
						placeholder='Select certificate type'
						required
						data={certificateTypes.map((ct) => ({
							value: ct.id.toString(),
							label: `${ct.name} (Level ${ct.lqfLevel})`,
						}))}
						searchable
						{...form.getInputProps('certificateTypeId')}
						value={form.values.certificateTypeId?.toString() || ''}
						onChange={(val) => {
							const id = val ? Number(val) : 0;
							form.setFieldValue('certificateTypeId', id);
							const ct = certificateTypes.find((c) => c.id === id);
							setSelectedCertType(ct || null);
						}}
					/>

					{selectedCertType && isSubjectBased && (
						<Paper withBorder p='md'>
							<Title order={5} mb='sm'>
								Subject-Based Requirements (LQF Level{' '}
								{selectedCertType.lqfLevel})
							</Title>

							<Group grow mb='md'>
								<NumberInput
									label='Minimum Passes Required'
									min={1}
									max={10}
									value={subjectGradeRules.minimumGrades.count}
									onChange={(val) =>
										setSubjectGradeRules((prev) => ({
											...prev,
											minimumGrades: {
												...prev.minimumGrades,
												count: Number(val) || 5,
											},
										}))
									}
								/>
								<Select
									label='Minimum Grade'
									data={standardGrades}
									value={subjectGradeRules.minimumGrades.grade}
									onChange={(val) =>
										setSubjectGradeRules((prev) => ({
											...prev,
											minimumGrades: {
												...prev.minimumGrades,
												grade: val || 'C',
											},
										}))
									}
								/>
							</Group>

							<Stack gap='xs'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Required Subjects
									</Text>
									<ActionIcon
										variant='light'
										color='blue'
										onClick={addRequiredSubject}
									>
										<IconPlus size={16} />
									</ActionIcon>
								</Group>

								{subjectGradeRules.requiredSubjects.map((rs, idx) => (
									<Group key={idx} gap='xs'>
										<Select
											placeholder='Select subject'
											data={subjects.map((s) => ({
												value: s.id.toString(),
												label: s.name,
											}))}
											value={rs.subjectId?.toString() || ''}
											onChange={(val) =>
												updateRequiredSubject(
													idx,
													'subjectId',
													val ? Number(val) : 0
												)
											}
											style={{ flex: 1 }}
											searchable
										/>
										<Select
											placeholder='Min grade'
											data={standardGrades}
											value={rs.minimumGrade}
											onChange={(val) =>
												updateRequiredSubject(idx, 'minimumGrade', val || 'C')
											}
											w={100}
										/>
										<ActionIcon
											variant='light'
											color='red'
											onClick={() => removeRequiredSubject(idx)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Group>
								))}
							</Stack>
						</Paper>
					)}

					{selectedCertType && !isSubjectBased && (
						<Paper withBorder p='md'>
							<Title order={5} mb='sm'>
								Classification-Based Requirements
							</Title>

							<Select
								label='Minimum Classification'
								data={classifications.map((c) => ({ value: c, label: c }))}
								value={classificationRules.minimumClassification}
								onChange={(val) =>
									setClassificationRules((prev) => ({
										...prev,
										minimumClassification:
											(val as (typeof classifications)[number]) || 'Credit',
									}))
								}
							/>

							<TextInput
								label='Required Qualification Name (Optional)'
								placeholder='e.g., Diploma in Information Technology'
								mt='md'
								value={classificationRules.requiredQualificationName || ''}
								onChange={(e) =>
									setClassificationRules((prev) => ({
										...prev,
										requiredQualificationName: e.target.value || undefined,
									}))
								}
							/>
						</Paper>
					)}
				</Stack>
			)}
		</Form>
	);
}
