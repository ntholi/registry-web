'use client';

import {
	Accordion,
	Alert,
	Anchor,
	Divider,
	Select,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useMemo, useState } from 'react';
import {
	type ActionResult,
	getActionErrorMessage,
	isActionResult,
} from '@/shared/lib/actions/actionResult';
import { toClassName } from '@/shared/lib/utils/utils';
import FormHeader from '@/shared/ui/adease/FormHeader';
import type { ObservationFormValues } from '../_lib/types';
import {
	checkObservationExists,
	getAssignedModules,
	getLecturersForSchool,
} from '../_server/actions';
import RatingInput from './RatingInput';

type Criterion = {
	id: string;
	title: string | null;
	text: string;
	description: string | null;
	sortOrder: number;
	categoryId: string;
	categoryName: string;
	section: 'teaching_observation' | 'assessments' | 'other';
	categorySortOrder: number;
};

type CycleOption = { id: string; name: string; termId: number };

type SectionKey = Criterion['section'];

type SectionGroup = {
	section: SectionKey;
	label: string;
	categories: Array<{
		id: string;
		name: string;
		criteria: Criterion[];
	}>;
	total: number;
};

type ObservationFormProps = {
	title: string;
	criteria: Criterion[];
	activeCycles: CycleOption[];
	onSubmit: (
		values: ObservationFormValues
	) => Promise<ActionResult<unknown> | unknown>;
	defaultValues?: Partial<ObservationFormValues> & {
		id?: string;
		lecturerUserId?: string;
	};
};

const SECTION_LABELS: Record<string, string> = {
	teaching_observation: 'Teaching Observation',
	assessments: 'Assessments',
	other: 'Other',
};

const SECTION_ORDER: SectionKey[] = [
	'teaching_observation',
	'assessments',
	'other',
];

export default function ObservationForm({
	title,
	criteria,
	activeCycles,
	onSubmit,
	defaultValues,
}: ObservationFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const isEdit = !!defaultValues?.id;

	const form = useForm<ObservationFormValues>({
		initialValues: {
			cycleId: defaultValues?.cycleId ?? '',
			assignedModuleId: defaultValues?.assignedModuleId ?? 0,
			strengths: defaultValues?.strengths ?? null,
			improvements: defaultValues?.improvements ?? null,
			recommendations: defaultValues?.recommendations ?? null,
			trainingArea: defaultValues?.trainingArea ?? null,
			ratings:
				defaultValues?.ratings ??
				criteria.map((c) => ({ criterionId: c.id, rating: null })),
		},
	});

	const [lecturerUserId, setLecturerUserId] = useState<string | null>(
		defaultValues?.lecturerUserId ?? null
	);

	const selectedCycle = activeCycles.find((c) => c.id === form.values.cycleId);

	const { data: lecturers = [] } = useQuery({
		queryKey: ['observation-lecturers', selectedCycle?.termId],
		queryFn: () => getLecturersForSchool(selectedCycle!.termId),
		enabled: !!selectedCycle?.termId,
	});

	const { data: assignedMods = [] } = useQuery({
		queryKey: [
			'observation-assigned-modules',
			lecturerUserId,
			selectedCycle?.termId,
		],
		queryFn: () => getAssignedModules(lecturerUserId!, selectedCycle!.termId),
		enabled: !!lecturerUserId && !!selectedCycle?.termId,
	});

	const { data: existingObs } = useQuery({
		queryKey: [
			'observation-exists',
			form.values.cycleId,
			form.values.assignedModuleId,
		],
		queryFn: () =>
			checkObservationExists(form.values.cycleId, form.values.assignedModuleId),
		enabled:
			!isEdit && !!form.values.cycleId && form.values.assignedModuleId > 0,
	});

	const grouped = useMemo(() => {
		const sections = new Map<
			SectionKey,
			Map<string, { name: string; sortOrder: number; criteria: Criterion[] }>
		>();
		for (const c of criteria) {
			if (!sections.has(c.section)) sections.set(c.section, new Map());
			const cats = sections.get(c.section)!;
			if (!cats.has(c.categoryId))
				cats.set(c.categoryId, {
					name: c.categoryName,
					sortOrder: c.categorySortOrder,
					criteria: [],
				});
			cats.get(c.categoryId)!.criteria.push(c);
		}

		return SECTION_ORDER.filter((section) => sections.has(section)).map(
			(section) => {
				const categories = Array.from(sections.get(section)!.entries())
					.map(([id, cat]) => ({
						id,
						name: cat.name,
						criteria: [...cat.criteria].sort(
							(a, b) => a.sortOrder - b.sortOrder
						),
						sortOrder: cat.sortOrder,
					}))
					.sort((a, b) => a.sortOrder - b.sortOrder)
					.map(({ sortOrder: _sortOrder, ...cat }) => cat);

				return {
					section,
					label: SECTION_LABELS[section] ?? section,
					categories,
					total: categories.reduce((sum, cat) => sum + cat.criteria.length, 0),
				} satisfies SectionGroup;
			}
		);
	}, [criteria]);

	const ratingMeta = useMemo(
		() =>
			new Map(
				form.values.ratings.map((rating, idx) => [
					rating.criterionId,
					{ idx, rating },
				])
			),
		[form.values.ratings]
	);

	const answeredCount = form.values.ratings.reduce(
		(count, rating) => count + (rating.rating ? 1 : 0),
		0
	);

	const totalCriteria = criteria.length;
	const _completion = totalCriteria
		? Math.round((answeredCount / totalCriteria) * 100)
		: 0;

	const mutation = useMutation({
		mutationFn: onSubmit,
		onSuccess: async (data) => {
			if (isActionResult(data) && !data.success) {
				notifications.show({
					title: 'Error',
					message: getActionErrorMessage(data.error),
					color: 'red',
				});
				return;
			}
			await queryClient.invalidateQueries({
				queryKey: ['teaching-observations'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: 'Observation saved',
				color: 'green',
			});
			router.back();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function getSectionAnsweredCount(section: SectionGroup) {
		return section.categories.reduce(
			(count, category) =>
				count +
				category.criteria.filter((criterion) => {
					const state = ratingMeta.get(criterion.id);
					return !!state?.rating.rating;
				}).length,
			0
		);
	}

	return (
		<form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
			<FormHeader
				title={title}
				isLoading={mutation.isPending}
				onClose={() => router.back()}
			/>
			<Stack p='xl' gap='lg'>
				{!isEdit && (
					<>
						<Select
							label='Cycle'
							placeholder='Select cycle'
							data={activeCycles.map((c) => ({
								value: c.id,
								label: c.name,
							}))}
							{...form.getInputProps('cycleId')}
							onChange={(v) => {
								form.setFieldValue('cycleId', v ?? '');
								form.setFieldValue('assignedModuleId', 0);
								setLecturerUserId(null);
							}}
						/>
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<Select
								label='Lecturer'
								placeholder='Select lecturer'
								searchable
								data={lecturers.map((l) => ({
									value: l.id,
									label: l.name,
								}))}
								value={lecturerUserId}
								onChange={(v) => {
									setLecturerUserId(v);
									form.setFieldValue('assignedModuleId', 0);
								}}
								disabled={!selectedCycle}
							/>
							<Select
								label='Assigned Module'
								placeholder='Select module'
								searchable
								data={assignedMods.map((m) => ({
									value: String(m.id),
									label: m.moduleName,
									description:
										m.programCode && m.semesterName
											? `${m.moduleCode} - ${toClassName(m.programCode, m.semesterName)}`
											: m.moduleCode,
								}))}
								renderOption={({ option }) => {
									const data = option as unknown as {
										label: string;
										description: string;
									};
									return (
										<Stack gap={0}>
											<Text size='sm' fw={500}>
												{data.label}
											</Text>
											<Text size='xs' c='dimmed'>
												{data.description}
											</Text>
										</Stack>
									);
								}}
								value={
									form.values.assignedModuleId > 0
										? String(form.values.assignedModuleId)
										: null
								}
								onChange={(v) =>
									form.setFieldValue('assignedModuleId', v ? Number(v) : 0)
								}
								disabled={!lecturerUserId}
							/>
						</SimpleGrid>
						{existingObs && (
							<Alert
								icon={<IconAlertCircle size={16} />}
								color='yellow'
								title='Observation already exists'
							>
								<Text size='sm'>
									An observation already exists for this cycle and module.{' '}
									<Anchor
										component={Link}
										href={`/appraisals/teaching-observations/${existingObs.id}`}
										size='sm'
									>
										View it here
									</Anchor>
								</Text>
							</Alert>
						)}
					</>
				)}

				<Accordion
					variant='separated'
					multiple
					defaultValue={grouped.map((section) => section.section)}
				>
					{grouped.map((section) => {
						const _sectionAnswered = getSectionAnsweredCount(section);

						return (
							<Accordion.Item key={section.section} value={section.section}>
								<Accordion.Control>
									<Stack gap={2}>
										<Title order={5}>{section.label}</Title>
										<Text size='sm' c='dimmed'>
											{section.total} questions in this section
										</Text>
									</Stack>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap='xl'>
										{section.categories.map((category) => (
											<Stack key={category.id} gap='md'>
												<Text
													size='sm'
													fw={600}
													c='dimmed'
													tt='uppercase'
													lts={0.5}
												>
													{category.name}
												</Text>
												{category.criteria.map((criterion) => {
													const state = ratingMeta.get(criterion.id);
													if (!state) return null;

													return (
														<Stack
															key={criterion.id}
															gap='xs'
															pb='md'
															style={{
																borderBottom:
																	'1px solid var(--mantine-color-default-border)',
															}}
														>
															{criterion.title && (
																<Text fw={600} size='sm'>
																	{criterion.title}
																</Text>
															)}
															<Text size='sm' c='dimmed'>
																{criterion.text}
															</Text>
															{criterion.description && (
																<Text size='xs' c='dimmed' opacity={0.7}>
																	{criterion.description}
																</Text>
															)}
															<RatingInput
																value={state.rating.rating ?? null}
																onChange={(val) =>
																	form.setFieldValue(
																		`ratings.${state.idx}.rating`,
																		val
																	)
																}
															/>
														</Stack>
													);
												})}
											</Stack>
										))}
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						);
					})}
				</Accordion>

				<Divider mt='lg' />
				<Title order={5}>Remarks</Title>
				<Textarea
					label='Strengths'
					autosize
					minRows={3}
					{...form.getInputProps('strengths')}
				/>
				<Textarea
					label='Areas for Improvement'
					autosize
					minRows={3}
					{...form.getInputProps('improvements')}
				/>
				<Textarea
					label='Recommendations'
					autosize
					minRows={3}
					{...form.getInputProps('recommendations')}
				/>
				<Textarea
					label='Identified Training Area'
					autosize
					minRows={2}
					{...form.getInputProps('trainingArea')}
				/>
			</Stack>
		</form>
	);
}
