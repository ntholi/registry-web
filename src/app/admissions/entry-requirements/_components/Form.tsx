'use client';

import { entryRequirements, type GradingType } from '@admissions/_database';
import {
	ActionIcon,
	Group,
	NumberInput,
	Paper,
	Select,
	Stack,
	Switch,
	TagsInput,
	Text,
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
	id: string;
	name: string;
	lqfLevel: number;
	gradingType: GradingType;
};
type Subject = { id: string; name: string };

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
				minimumGrades: [{ count: 5, grade: 'C' }],
				subjects: [],
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
				courses: [],
			};
		});

	const schema = z.object({
		...createInsertSchema(entryRequirements).shape,
		programId: z.coerce.number().min(1, 'Program is required'),
		certificateTypeId: z.string().min(1, 'Certificate type is required'),
	});

	const isSubjectBased = selectedCertType?.gradingType === 'subject-grades';

	const handleSubmit = async (values: EntryRequirement) => {
		const rules = isSubjectBased ? subjectGradeRules : classificationRules;
		return onSubmit({ ...values, rules });
	};

	const addSubject = () => {
		setSubjectGradeRules((prev) => ({
			...prev,
			subjects: [
				...prev.subjects,
				{ subjectId: '', minimumGrade: 'C', required: true },
			],
		}));
	};

	const removeSubject = (index: number) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			subjects: prev.subjects.filter((_, i) => i !== index),
		}));
	};

	const updateSubject = (
		index: number,
		field: 'subjectId' | 'minimumGrade' | 'required',
		value: string | boolean
	) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			subjects: prev.subjects.map((s, i) =>
				i === index ? { ...s, [field]: value } : s
			),
		}));
	};

	const addMinimumGradeRule = () => {
		setSubjectGradeRules((prev) => ({
			...prev,
			minimumGrades: [...prev.minimumGrades, { count: 1, grade: 'C' }],
		}));
	};

	const updateMinimumGradeRule = (
		index: number,
		field: 'count' | 'grade',
		value: number | string
	) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			minimumGrades: prev.minimumGrades.map((rule, i) =>
				i === index ? { ...rule, [field]: value } : rule
			),
		}));
	};

	const removeMinimumGradeRule = (index: number) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			minimumGrades: prev.minimumGrades.filter((_, i) => i !== index),
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
						value={form.values.certificateTypeId || ''}
						onChange={(val) => {
							const id = val || '';
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

							<Stack gap='xs' mb='md'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Minimum Grades
									</Text>
									<ActionIcon
										variant='light'
										color='blue'
										onClick={addMinimumGradeRule}
									>
										<IconPlus size={16} />
									</ActionIcon>
								</Group>

								{subjectGradeRules.minimumGrades.map((rule, idx) => (
									<Group key={idx} gap='xs' align='flex-end'>
										<NumberInput
											label='Minimum Passes'
											min={1}
											max={10}
											value={rule.count}
											onChange={(val) =>
												updateMinimumGradeRule(idx, 'count', Number(val) || 1)
											}
										/>
										<Select
											label='Minimum Grade'
											data={standardGrades}
											value={rule.grade}
											onChange={(val) =>
												updateMinimumGradeRule(idx, 'grade', val || 'C')
											}
										/>
										<ActionIcon
											variant='light'
											color='red'
											onClick={() => removeMinimumGradeRule(idx)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Group>
								))}
							</Stack>

							<Stack gap='xs'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Subjects
									</Text>
									<ActionIcon variant='light' color='blue' onClick={addSubject}>
										<IconPlus size={16} />
									</ActionIcon>
								</Group>

								{subjectGradeRules.subjects.map((rs, idx) => (
									<Group key={idx} gap='xs'>
										<Select
											placeholder='Select subject'
											data={subjects.map((s) => ({
												value: s.id.toString(),
												label: s.name,
											}))}
											value={rs.subjectId?.toString() || ''}
											onChange={(val) =>
												updateSubject(idx, 'subjectId', val || '')
											}
											style={{ flex: 1 }}
											searchable
										/>
										<Select
											placeholder='Min grade'
											data={standardGrades}
											value={rs.minimumGrade}
											onChange={(val) =>
												updateSubject(idx, 'minimumGrade', val || 'C')
											}
											w={100}
										/>
										<Switch
											label='Required'
											checked={rs.required}
											onChange={(event) =>
												updateSubject(
													idx,
													'required',
													event.currentTarget.checked
												)
											}
											labelPosition='left'
										/>
										<ActionIcon
											variant='light'
											color='red'
											onClick={() => removeSubject(idx)}
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

							<TagsInput
								label='Eligible Courses'
								placeholder='Add courses'
								mt='md'
								value={classificationRules.courses}
								onChange={(value) =>
									setClassificationRules((prev) => ({
										...prev,
										courses: value,
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
