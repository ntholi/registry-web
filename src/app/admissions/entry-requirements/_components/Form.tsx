'use client';

import { entryRequirements } from '@admissions/_database';
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
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type {
	EntryRequirement,
	Level4Rules,
	Level5PlusRules,
} from '../_lib/types';

type Program = { id: number; code: string; name: string };
type CertificateType = { id: number; name: string; lqfLevel: number };
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
		useState<CertificateType | null>(null);

	const [level4Rules, setLevel4Rules] = useState<Level4Rules>({
		type: 'level4',
		minimumGrades: { count: 5, grade: 'C' },
		requiredSubjects: [],
	});

	const [level5Rules, setLevel5Rules] = useState<Level5PlusRules>({
		type: 'level5plus',
		minimumClassification: 'Credit',
	});

	useEffect(() => {
		if (defaultValues?.certificateTypeId) {
			const ct = certificateTypes.find(
				(c) => c.id === defaultValues.certificateTypeId
			);
			setSelectedCertType(ct || null);
			if (defaultValues.rules) {
				const rules = defaultValues.rules as Level4Rules | Level5PlusRules;
				if (rules.type === 'level4') {
					setLevel4Rules(rules);
				} else {
					setLevel5Rules(rules);
				}
			}
		}
	}, [defaultValues, certificateTypes]);

	const schema = z.object({
		...createInsertSchema(entryRequirements).shape,
		programId: z.coerce.number().min(1, 'Program is required'),
		certificateTypeId: z.coerce.number().min(1, 'Certificate type is required'),
	});

	const isLevel4 = selectedCertType?.lqfLevel === 4;

	const handleSubmit = async (values: EntryRequirement) => {
		const rules = isLevel4 ? level4Rules : level5Rules;
		return onSubmit({ ...values, rules });
	};

	const addRequiredSubject = () => {
		setLevel4Rules((prev) => ({
			...prev,
			requiredSubjects: [
				...prev.requiredSubjects,
				{ subjectId: 0, minimumGrade: 'C' },
			],
		}));
	};

	const removeRequiredSubject = (index: number) => {
		setLevel4Rules((prev) => ({
			...prev,
			requiredSubjects: prev.requiredSubjects.filter((_, i) => i !== index),
		}));
	};

	const updateRequiredSubject = (
		index: number,
		field: 'subjectId' | 'minimumGrade',
		value: number | string
	) => {
		setLevel4Rules((prev) => ({
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

					{selectedCertType && isLevel4 && (
						<Paper withBorder p='md'>
							<Title order={5} mb='md'>
								Level 4 Requirements
							</Title>

							<Group grow mb='md'>
								<NumberInput
									label='Minimum Passes Required'
									min={1}
									max={10}
									value={level4Rules.minimumGrades.count}
									onChange={(val) =>
										setLevel4Rules((prev) => ({
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
									value={level4Rules.minimumGrades.grade}
									onChange={(val) =>
										setLevel4Rules((prev) => ({
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

								{level4Rules.requiredSubjects.map((rs, idx) => (
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

					{selectedCertType && !isLevel4 && (
						<Paper withBorder p='md'>
							<Title order={5} mb='md'>
								Level {selectedCertType.lqfLevel} Requirements
							</Title>

							<Select
								label='Minimum Classification'
								data={classifications.map((c) => ({ value: c, label: c }))}
								value={level5Rules.minimumClassification}
								onChange={(val) =>
									setLevel5Rules((prev) => ({
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
								value={level5Rules.requiredQualificationName || ''}
								onChange={(e) =>
									setLevel5Rules((prev) => ({
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
