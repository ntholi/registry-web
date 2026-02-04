'use client';

import { entryRequirements, type GradingType } from '@admissions/_database';
import {
	ActionIcon,
	Box,
	Divider,
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
	GradeRequirementOption,
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
				gradeOptions: [[{ count: 5, grade: 'C' }]],
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

	const addGradeOption = () => {
		setSubjectGradeRules((prev) => ({
			...prev,
			gradeOptions: [...prev.gradeOptions, [{ count: 4, grade: 'C' }]],
		}));
	};

	const removeGradeOption = (optionIndex: number) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.filter((_, i) => i !== optionIndex),
		}));
	};

	const addGradeRule = (optionIndex: number) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.map((option, i) =>
				i === optionIndex ? [...option, { count: 2, grade: 'D' }] : option
			),
		}));
	};

	const updateGradeRule = (
		optionIndex: number,
		ruleIndex: number,
		field: 'count' | 'grade',
		value: number | string
	) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.map((option, oi) =>
				oi === optionIndex
					? option.map((rule, ri) =>
							ri === ruleIndex ? { ...rule, [field]: value } : rule
						)
					: option
			),
		}));
	};

	const removeGradeRule = (optionIndex: number, ruleIndex: number) => {
		setSubjectGradeRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.map((option, i) =>
				i === optionIndex ? option.filter((_, ri) => ri !== ruleIndex) : option
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

							<Stack gap='md' mb='md'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Grade Options
									</Text>
									<ActionIcon
										variant='light'
										color='green'
										onClick={addGradeOption}
										title='Add alternative option'
									>
										<IconPlus size={16} />
									</ActionIcon>
								</Group>

								{subjectGradeRules.gradeOptions.map((option, optionIdx) => (
									<Box key={optionIdx}>
										{optionIdx > 0 && (
											<Divider
												my='sm'
												label='OR'
												labelPosition='center'
												color='blue'
											/>
										)}
										<GradeOptionEditor
											option={option}
											optionIndex={optionIdx}
											canRemove={subjectGradeRules.gradeOptions.length > 1}
											onAddRule={() => addGradeRule(optionIdx)}
											onUpdateRule={(ruleIdx, field, value) =>
												updateGradeRule(optionIdx, ruleIdx, field, value)
											}
											onRemoveRule={(ruleIdx) =>
												removeGradeRule(optionIdx, ruleIdx)
											}
											onRemoveOption={() => removeGradeOption(optionIdx)}
										/>
									</Box>
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

type GradeOptionEditorProps = {
	option: GradeRequirementOption;
	optionIndex: number;
	canRemove: boolean;
	onAddRule: () => void;
	onUpdateRule: (
		ruleIndex: number,
		field: 'count' | 'grade',
		value: number | string
	) => void;
	onRemoveRule: (ruleIndex: number) => void;
	onRemoveOption: () => void;
};

function GradeOptionEditor({
	option,
	optionIndex,
	canRemove,
	onAddRule,
	onUpdateRule,
	onRemoveRule,
	onRemoveOption,
}: GradeOptionEditorProps) {
	return (
		<Paper withBorder p='sm' bg='var(--mantine-color-dark-7)'>
			<Group justify='space-between' mb='xs'>
				<Text size='xs' c='dimmed'>
					Option {optionIndex + 1}
				</Text>
				<Group gap='xs'>
					<ActionIcon
						variant='light'
						color='blue'
						onClick={onAddRule}
						size='sm'
					>
						<IconPlus size={14} />
					</ActionIcon>
					{canRemove && (
						<ActionIcon
							variant='light'
							color='red'
							onClick={onRemoveOption}
							size='sm'
						>
							<IconTrash size={14} />
						</ActionIcon>
					)}
				</Group>
			</Group>
			<Stack gap='xs'>
				{option.map((rule, ruleIdx) => (
					<Group key={ruleIdx} gap='xs' align='flex-end'>
						<NumberInput
							label='Passes'
							min={1}
							max={10}
							size='xs'
							w={80}
							value={rule.count}
							onChange={(val) =>
								onUpdateRule(ruleIdx, 'count', Number(val) || 1)
							}
						/>
						<Select
							label='Grade'
							data={standardGrades}
							size='xs'
							w={80}
							value={rule.grade}
							onChange={(val) => onUpdateRule(ruleIdx, 'grade', val || 'C')}
						/>
						{option.length > 1 && (
							<ActionIcon
								variant='light'
								color='red'
								onClick={() => onRemoveRule(ruleIdx)}
								size='sm'
							>
								<IconTrash size={14} />
							</ActionIcon>
						)}
					</Group>
				))}
			</Stack>
		</Paper>
	);
}
