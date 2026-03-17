'use client';

import {
	Accordion,
	Alert,
	Anchor,
	Group,
	Select,
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
	text: string;
	description: string | null;
	sortOrder: number;
	categoryId: string;
	categoryName: string;
	section: 'teaching_observation' | 'assessments' | 'other';
	categorySortOrder: number;
};

type CycleOption = { id: string; name: string; termId: number };

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
			string,
			Map<string, { name: string; criteria: Criterion[] }>
		>();
		for (const c of criteria) {
			if (!sections.has(c.section)) sections.set(c.section, new Map());
			const cats = sections.get(c.section)!;
			if (!cats.has(c.categoryId))
				cats.set(c.categoryId, { name: c.categoryName, criteria: [] });
			cats.get(c.categoryId)!.criteria.push(c);
		}
		return sections;
	}, [criteria]);

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

	function getRatingIndex(criterionId: string) {
		return form.values.ratings.findIndex((r) => r.criterionId === criterionId);
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
								label: `${m.moduleCode} — ${m.moduleName}${m.programCode ? ` (${m.programCode})` : ''}`,
							}))}
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
					defaultValue={Array.from(grouped.keys())}
				>
					{Array.from(grouped.entries()).map(([section, categories]) => (
						<Accordion.Item key={section} value={section}>
							<Accordion.Control>
								<Title order={5}>{SECTION_LABELS[section] ?? section}</Title>
							</Accordion.Control>
							<Accordion.Panel>
								<Stack gap='xl'>
									{Array.from(categories.entries()).map(
										([catId, { name, criteria: catCriteria }]) => (
											<Stack key={catId} gap='sm'>
												<Text fw={600} size='sm' c='dimmed'>
													{name}
												</Text>
												{catCriteria.map((criterion) => {
													const idx = getRatingIndex(criterion.id);
													return (
														<Group
															key={criterion.id}
															justify='space-between'
															wrap='nowrap'
															align='flex-start'
														>
															<Stack gap={2} style={{ flex: 1 }}>
																<Text size='sm' fw={500}>
																	{criterion.text}
																</Text>
																{criterion.description && (
																	<Text size='xs' c='dimmed'>
																		{criterion.description}
																	</Text>
																)}
															</Stack>
															<RatingInput
																value={form.values.ratings[idx]?.rating ?? null}
																onChange={(val) =>
																	form.setFieldValue(
																		`ratings.${idx}.rating`,
																		val
																	)
																}
															/>
														</Group>
													);
												})}
											</Stack>
										)
									)}
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>

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
