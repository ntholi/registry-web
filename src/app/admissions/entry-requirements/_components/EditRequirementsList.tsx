'use client';

import type { GradingType } from '@admissions/_database';
import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	NumberInput,
	Paper,
	Select,
	Stack,
	TagsInput,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconCertificate,
	IconDeviceFloppy,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type {
	ClassificationRules,
	EntryRequirement,
	GradeRequirementOption,
	SubjectGradeRules,
} from '../_lib/types';
import {
	createEntryRequirement,
	deleteEntryRequirement,
	updateEntryRequirement,
} from '../_server/actions';
import RequiredSubjectModal from './RequiredSubjectModal';
import SubjectGroupModal from './SubjectGroupModal';

type CertificateType = {
	id: string;
	name: string;
	lqfLevel: number;
	gradingType: GradingType;
};

type Subject = { id: string; name: string };

type RequirementItem = EntryRequirement & {
	certificateType: { id: string; name: string; lqfLevel: number } | null;
};

type Props = {
	programId: number;
	requirements: RequirementItem[];
	certificateTypes: CertificateType[];
	subjects: Subject[];
};

const standardGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];
const classifications = ['Distinction', 'Merit', 'Credit', 'Pass'] as const;

export default function EditRequirementsList({
	programId,
	requirements: initialRequirements,
	certificateTypes,
	subjects,
}: Props) {
	const queryClient = useQueryClient();
	const [requirements, setRequirements] =
		useState<RequirementItem[]>(initialRequirements);

	const lgcseRequirement = initialRequirements.find(
		(r) => r.certificateType?.name === 'LGCSE'
	);
	const [expandedId, setExpandedId] = useState<string | null>(
		lgcseRequirement?.id || initialRequirements[0]?.id || null
	);

	const usedCertTypeIds = new Set(requirements.map((r) => r.certificateTypeId));
	const availableCertTypes = certificateTypes.filter(
		(ct) => !usedCertTypeIds.has(ct.id)
	);

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: (typeof initialRequirements)[0];
		}) => updateEntryRequirement(id, data),
		onSuccess: () => {
			setExpandedId(null);
			queryClient.invalidateQueries({ queryKey: ['entry-requirements'] });
		},
	});

	const createMutation = useMutation({
		mutationFn: (data: {
			programId: number;
			certificateTypeId: string;
			rules: SubjectGradeRules | ClassificationRules;
		}) => createEntryRequirement(data),
		onSuccess: (newReq) => {
			const certType = certificateTypes.find(
				(ct) => ct.id === newReq.certificateTypeId
			);
			setRequirements((prev) => [
				...prev,
				{ ...newReq, certificateType: certType || null } as RequirementItem,
			]);
			setExpandedId(newReq.id);
			queryClient.invalidateQueries({ queryKey: ['entry-requirements'] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteEntryRequirement(id),
		onSuccess: (_, id) => {
			setRequirements((prev) => prev.filter((r) => r.id !== id));
			queryClient.invalidateQueries({ queryKey: ['entry-requirements'] });
		},
	});

	const handleAddRequirement = (certificateTypeId: string) => {
		const certType = certificateTypes.find((ct) => ct.id === certificateTypeId);
		if (!certType) return;

		const isSubjectBased = certType.gradingType === 'subject-grades';
		const rules: SubjectGradeRules | ClassificationRules = isSubjectBased
			? {
					type: 'subject-grades',
					gradeOptions: [[{ count: 5, grade: 'C' }]],
					subjects: [],
				}
			: {
					type: 'classification',
					minimumClassification: 'Credit',
					courses: [],
				};

		createMutation.mutate({ programId, certificateTypeId, rules });
	};

	const handleSave = (req: RequirementItem) => {
		updateMutation.mutate({ id: req.id, data: req });
	};

	const handleDelete = (id: string) => {
		deleteMutation.mutate(id);
	};

	const sortedRequirements = [...requirements].sort(
		(a, b) =>
			(a.certificateType?.lqfLevel || 0) - (b.certificateType?.lqfLevel || 0)
	);

	return (
		<Stack gap='md'>
			{availableCertTypes.sort((a, b) => a.lqfLevel - b.lqfLevel).length >
				0 && (
				<Select
					placeholder='Add entry pathway...'
					data={availableCertTypes.map((ct) => ({
						value: ct.id,
						label: `${ct.name} (Level ${ct.lqfLevel})`,
					}))}
					searchable
					clearable
					onChange={(val) => val && handleAddRequirement(val)}
					disabled={createMutation.isPending}
				/>
			)}

			<Accordion
				variant='separated'
				radius='md'
				value={expandedId}
				onChange={setExpandedId}
			>
				{sortedRequirements.map((req, index) => (
					<RequirementEditor
						key={req.id}
						requirement={req}
						index={index}
						subjects={subjects}
						certificateTypes={certificateTypes}
						onSave={handleSave}
						onDelete={handleDelete}
						isSaving={
							updateMutation.isPending &&
							updateMutation.variables?.id === req.id
						}
						isDeleting={
							deleteMutation.isPending && deleteMutation.variables === req.id
						}
					/>
				))}
			</Accordion>
		</Stack>
	);
}

type EditorProps = {
	requirement: RequirementItem;
	index: number;
	subjects: Subject[];
	certificateTypes: CertificateType[];
	onSave: (req: RequirementItem) => void;
	onDelete: (id: string) => void;
	isSaving: boolean;
	isDeleting: boolean;
};

function RequirementEditor({
	requirement,
	index,
	subjects,
	certificateTypes,
	onSave,
	onDelete,
	isSaving,
	isDeleting,
}: EditorProps) {
	const [deleteOpened, { open: openDelete, close: closeDelete }] =
		useDisclosure(false);
	const certType = certificateTypes.find(
		(ct) => ct.id === requirement.certificateTypeId
	);
	const isSubjectBased = certType?.gradingType === 'subject-grades';

	const [subjectRules, setSubjectRules] = useState<SubjectGradeRules>(() => {
		const rules = requirement.rules as SubjectGradeRules | ClassificationRules;
		if (rules?.type === 'subject-grades') return rules;
		return {
			type: 'subject-grades',
			gradeOptions: [[{ count: 5, grade: 'C' }]],
			subjects: [],
		};
	});

	const [classRules, setClassRules] = useState<ClassificationRules>(() => {
		const rules = requirement.rules as SubjectGradeRules | ClassificationRules;
		if (rules?.type === 'classification') return rules;
		return {
			type: 'classification',
			minimumClassification: 'Credit',
			courses: [],
		};
	});

	const handleSave = () => {
		const rules = isSubjectBased ? subjectRules : classRules;
		onSave({ ...requirement, rules });
	};

	const handleAddSubject = (subject: {
		subjectId: string;
		minimumGrade: string;
		required: boolean;
	}) => {
		setSubjectRules((prev) => ({
			...prev,
			subjects: [...prev.subjects, subject],
		}));
	};

	const handleUpdateSubject = (
		idx: number,
		subject: { subjectId: string; minimumGrade: string; required: boolean }
	) => {
		setSubjectRules((prev) => ({
			...prev,
			subjects: prev.subjects.map((s, i) => (i === idx ? subject : s)),
		}));
	};

	const handleRemoveSubject = (idx: number) => {
		setSubjectRules((prev) => ({
			...prev,
			subjects: prev.subjects.filter((_, i) => i !== idx),
		}));
	};

	const handleAddSubjectGroup = (
		group: NonNullable<SubjectGradeRules['subjectGroups']>[0]
	) => {
		setSubjectRules((prev) => ({
			...prev,
			subjectGroups: [...(prev.subjectGroups || []), group],
		}));
	};

	const handleUpdateSubjectGroup = (
		idx: number,
		group: NonNullable<SubjectGradeRules['subjectGroups']>[0]
	) => {
		setSubjectRules((prev) => ({
			...prev,
			subjectGroups: prev.subjectGroups?.map((g, i) => (i === idx ? group : g)),
		}));
	};

	const handleRemoveSubjectGroup = (idx: number) => {
		setSubjectRules((prev) => ({
			...prev,
			subjectGroups: prev.subjectGroups?.filter((_, i) => i !== idx),
		}));
	};

	const handleAddGradeOption = () => {
		setSubjectRules((prev) => ({
			...prev,
			gradeOptions: [...prev.gradeOptions, [{ count: 4, grade: 'C' }]],
		}));
	};

	const handleRemoveGradeOption = (optionIdx: number) => {
		setSubjectRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.filter((_, i) => i !== optionIdx),
		}));
	};

	const handleAddGradeRule = (optionIdx: number) => {
		setSubjectRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.map((option, i) =>
				i === optionIdx ? [...option, { count: 2, grade: 'D' }] : option
			),
		}));
	};

	const handleUpdateGradeRule = (
		optionIdx: number,
		ruleIdx: number,
		field: 'count' | 'grade',
		value: string | number
	) => {
		setSubjectRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.map((option, oi) =>
				oi === optionIdx
					? option.map((rule, ri) =>
							ri === ruleIdx ? { ...rule, [field]: value } : rule
						)
					: option
			),
		}));
	};

	const handleRemoveGradeRule = (optionIdx: number, ruleIdx: number) => {
		setSubjectRules((prev) => ({
			...prev,
			gradeOptions: prev.gradeOptions.map((option, i) =>
				i === optionIdx ? option.filter((_, ri) => ri !== ruleIdx) : option
			),
		}));
	};

	const formatGradeOptions = (options: GradeRequirementOption[]) => {
		return options
			.map((opt) => opt.map((g) => `${g.count}${g.grade}`).join(' + '))
			.join(' OR ');
	};

	return (
		<Accordion.Item value={requirement.id}>
			<Accordion.Control>
				<Group gap='md'>
					<ThemeIcon
						size='md'
						radius='xl'
						variant='light'
						color={index === 0 ? 'green' : 'blue'}
					>
						<IconCertificate size='1rem' />
					</ThemeIcon>
					<div>
						<Group gap='xs'>
							<Text fw={500}>
								{requirement.certificateType?.name || 'Unknown'}
							</Text>
							<Badge size='xs' variant='light'>
								Level {requirement.certificateType?.lqfLevel}
							</Badge>
						</Group>
						<Text size='xs' c='dimmed'>
							{isSubjectBased
								? formatGradeOptions(subjectRules.gradeOptions)
								: `${classRules.minimumClassification} classification`}
						</Text>
					</div>
				</Group>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack gap='md'>
					{isSubjectBased ? (
						<Paper withBorder p='md'>
							<Title order={6} mb='sm'>
								Subject-Based Requirements
							</Title>
							<Stack gap='xs' mb='md'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Grade Options
									</Text>
									<ActionIcon
										variant='light'
										color='green'
										onClick={handleAddGradeOption}
										title='Add alternative option'
									>
										<IconPlus size={14} />
									</ActionIcon>
								</Group>
								<Text size='xs' c='dimmed'>
									Applicant must satisfy ANY one option (alternatives)
								</Text>

								{subjectRules.gradeOptions.map((option, optionIdx) => (
									<Box key={optionIdx}>
										{optionIdx > 0 && (
											<Divider
												my='sm'
												label='OR'
												labelPosition='center'
												color='blue'
											/>
										)}
										<Paper withBorder p='sm' bg='var(--mantine-color-dark-8)'>
											<Group justify='space-between' mb='xs'>
												<Text size='xs' c='dimmed'>
													Option {optionIdx + 1}
												</Text>
												<Group gap='xs'>
													<ActionIcon
														variant='light'
														color='blue'
														size='sm'
														onClick={() => handleAddGradeRule(optionIdx)}
														title='Add grade requirement'
													>
														<IconPlus size={14} />
													</ActionIcon>
													{subjectRules.gradeOptions.length > 1 && (
														<ActionIcon
															variant='subtle'
															color='red'
															size='sm'
															onClick={() => handleRemoveGradeOption(optionIdx)}
															title='Remove option'
														>
															<IconTrash size={14} />
														</ActionIcon>
													)}
												</Group>
											</Group>
											<Stack gap='xs'>
												{option.map((rule, ruleIdx) => (
													<Group
														key={ruleIdx}
														gap='sm'
														wrap='nowrap'
														align='center'
													>
														<NumberInput
															min={1}
															max={10}
															value={rule.count}
															onChange={(val) =>
																handleUpdateGradeRule(
																	optionIdx,
																	ruleIdx,
																	'count',
																	Number(val) || 1
																)
															}
															w={70}
															size='xs'
														/>
														<Text size='sm'>passes at</Text>
														<Select
															data={standardGrades}
															value={rule.grade}
															onChange={(val) =>
																handleUpdateGradeRule(
																	optionIdx,
																	ruleIdx,
																	'grade',
																	val || 'C'
																)
															}
															w={80}
															size='xs'
														/>
														<Text size='sm'>or better</Text>
														{option.length > 1 && (
															<ActionIcon
																variant='subtle'
																color='red'
																size='sm'
																onClick={() =>
																	handleRemoveGradeRule(optionIdx, ruleIdx)
																}
															>
																<IconTrash size={14} />
															</ActionIcon>
														)}
													</Group>
												))}
											</Stack>
										</Paper>
									</Box>
								))}
							</Stack>

							<Divider my='md' />

							<Stack gap='xs'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Subjects
									</Text>
									<RequiredSubjectModal
										mode='add'
										subjects={subjects}
										onSave={handleAddSubject}
									/>
								</Group>

								{subjectRules.subjects.map((rs, idx) => {
									const subjectName =
										subjects.find((s) => s.id === rs.subjectId)?.name ||
										'Unknown Subject';
									return (
										<Paper
											key={idx}
											withBorder
											p='sm'
											bg='var(--mantine-color-dark-8)'
										>
											<Group justify='space-between'>
												<Group gap='xs'>
													<Text size='sm'>{subjectName}</Text>
													<Badge size='xs' variant='light'>
														Min: {rs.minimumGrade}
													</Badge>
													{rs.required ? (
														<Badge size='xs' color='red' variant='light'>
															Required
														</Badge>
													) : (
														<Badge size='xs' color='teal' variant='light'>
															Advantage
														</Badge>
													)}
												</Group>
												<Group gap='xs'>
													<RequiredSubjectModal
														mode='edit'
														subject={rs}
														subjects={subjects}
														onSave={(s) => handleUpdateSubject(idx, s)}
													/>
													<ActionIcon
														variant='subtle'
														color='red'
														size='sm'
														onClick={() => handleRemoveSubject(idx)}
													>
														<IconTrash size={14} />
													</ActionIcon>
												</Group>
											</Group>
										</Paper>
									);
								})}
							</Stack>

							<Divider my='md' />

							<Stack gap='xs'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Subject Groups
									</Text>
									<SubjectGroupModal
										mode='add'
										subjects={subjects}
										onSave={handleAddSubjectGroup}
									/>
								</Group>

								<Text size='xs' c='dimmed'>
									Define group of subjects an applicant can have
								</Text>

								{subjectRules.subjectGroups?.map((group, idx) => (
									<Paper
										key={idx}
										withBorder
										p='sm'
										bg='var(--mantine-color-dark-8)'
									>
										<Group justify='space-between'>
											<div>
												<Group gap='xs'>
													<Text size='sm' fw={500}>
														{group.name || 'Unnamed Group'}
													</Text>
													{group.required && (
														<Badge size='xs' color='red'>
															Required
														</Badge>
													)}
													<Badge size='xs' variant='light'>
														Min: {group.minimumGrade}
													</Badge>
												</Group>
												<Text size='xs' c='dimmed'>
													{group.subjectIds.length} subject(s)
												</Text>
											</div>
											<Group gap='xs'>
												<SubjectGroupModal
													mode='edit'
													group={group}
													subjects={subjects}
													onSave={(g) => handleUpdateSubjectGroup(idx, g)}
												/>
												<ActionIcon
													variant='subtle'
													color='red'
													size='sm'
													onClick={() => handleRemoveSubjectGroup(idx)}
												>
													<IconTrash size={14} />
												</ActionIcon>
											</Group>
										</Group>
									</Paper>
								))}
							</Stack>
						</Paper>
					) : (
						<Paper withBorder p='md'>
							<Title order={6} mb='sm'>
								Classification-Based Requirements
							</Title>
							<Select
								label='Minimum Classification'
								data={classifications.map((c) => ({ value: c, label: c }))}
								value={classRules.minimumClassification}
								onChange={(val) =>
									setClassRules((prev) => ({
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
								value={classRules.courses}
								onChange={(value) =>
									setClassRules((prev) => ({
										...prev,
										courses: value,
									}))
								}
							/>
						</Paper>
					)}

					<Group justify='space-between'>
						<Button
							variant='light'
							color='red'
							size='xs'
							leftSection={<IconTrash size={14} />}
							onClick={openDelete}
							loading={isDeleting}
						>
							Remove Pathway
						</Button>
						<Button
							size='xs'
							leftSection={<IconDeviceFloppy size={14} />}
							onClick={handleSave}
							loading={isSaving}
						>
							Save Changes
						</Button>
					</Group>

					<Modal
						opened={deleteOpened}
						onClose={closeDelete}
						title='Remove Entry Pathway'
						centered
						size='sm'
					>
						<Stack gap='md'>
							<Text size='sm'>
								Are you sure you want to remove the{' '}
								<strong>{requirement.certificateType?.name}</strong> entry
								pathway? This action cannot be undone.
							</Text>
							<Group justify='flex-end'>
								<Button variant='default' onClick={closeDelete}>
									Cancel
								</Button>
								<Button
									color='red'
									onClick={() => {
										onDelete(requirement.id);
										closeDelete();
									}}
									loading={isDeleting}
								>
									Remove
								</Button>
							</Group>
						</Stack>
					</Modal>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
