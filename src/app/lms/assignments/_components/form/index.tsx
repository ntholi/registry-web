'use client';

import {
	Badge,
	Button,
	Grid,
	Group,
	Loader,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
	ASSESSMENT_TYPES,
	COURSE_WORK_OPTIONS,
} from '@/app/academic/assessments/_lib/utils';
import { getAssessmentByModuleId } from '@/app/academic/assessments/_server/actions';
import {
	createDraftAssignment,
	publishAssignment,
	updateAssignment,
} from '../../_server/actions';
import AttachmentsSection from './AttachmentsSection';
import ContentTabs from './ContentTabs';
import SettingsPanel from './SettingsPanel';

const schema = z.object({
	assessmentNumber: z.string().min(1, 'Assignment number is required'),
	assessmentType: z.string().min(1, 'Assignment type is required'),
	totalMarks: z.number().min(1, 'Total marks must be at least 1'),
	weight: z.number().min(1).max(100, 'Weight must be between 1 and 100'),
	availableFrom: z.string().nullable(),
	dueDate: z
		.string()
		.nullable()
		.refine((val) => val !== null && val !== '', {
			message: 'Due date is required',
		}),
	description: z.string().optional(),
	instructions: z.string().optional(),
	attachments: z.array(z.instanceof(File)).optional(),
});

export type FormValues = z.infer<typeof schema>;

type AssignmentFormProps = {
	courseId: number;
	moduleId: number;
};

type SaveState = 'idle' | 'saving' | 'saved';

const ASSIGNMENT_TYPES = ASSESSMENT_TYPES.filter((t) =>
	/^Assignment \d+$/.test(t.label)
);

function getNextAssignmentType(
	used: string[]
): { value: string; label: string } | undefined {
	const usedLabels = new Set(used);
	return ASSIGNMENT_TYPES.find((t) => !usedLabels.has(t.label));
}

export default function AssignmentForm({
	courseId,
	moduleId,
}: AssignmentFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [draftId, setDraftId] = useState<number | null>(null);
	const [saveState, setSaveState] = useState<SaveState>('idle');
	const savingRef = useRef(false);

	const { data: assessments } = useQuery({
		queryKey: ['module-assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
		enabled: opened,
	});

	const form = useForm<FormValues>({
		initialValues: {
			assessmentNumber: '',
			assessmentType: '',
			totalMarks: 100,
			weight: 0,
			availableFrom: new Date().toISOString(),
			dueDate: null,
			description: '',
			instructions: '',
			attachments: [],
		},
	});

	const formResetRef = useRef(form.reset);
	const formSetFieldValueRef = useRef(form.setFieldValue);

	useEffect(() => {
		formResetRef.current = form.reset;
		formSetFieldValueRef.current = form.setFieldValue;
	}, [form.reset, form.setFieldValue]);

	useEffect(() => {
		if (!opened) return;

		formResetRef.current();
		setDraftId(null);
		setSaveState('idle');

		if (assessments && assessments.length > 0) {
			const assessmentNumbers = assessments
				.map((a) => {
					const match = a.assessmentNumber.match(/CW(\d+)/);
					return match ? parseInt(match[1], 10) : 0;
				})
				.filter((n) => n > 0);

			if (assessmentNumbers.length > 0) {
				const highestNumber = Math.max(...assessmentNumbers);
				const nextNumber = highestNumber + 1;
				if (nextNumber <= 15) {
					formSetFieldValueRef.current('assessmentNumber', `CW${nextNumber}`);
				}
			} else {
				formSetFieldValueRef.current('assessmentNumber', 'CW1');
			}

			const usedTypes = assessments.map((a) => a.assessmentType);
			const nextAssignment = getNextAssignmentType(usedTypes);
			if (nextAssignment) {
				formSetFieldValueRef.current('assessmentType', nextAssignment.value);
			}
		} else {
			formSetFieldValueRef.current('assessmentNumber', 'CW1');
			const firstAssignment = ASSIGNMENT_TYPES[0];
			if (firstAssignment) {
				formSetFieldValueRef.current('assessmentType', firstAssignment.value);
			}
		}

		const oneWeek = new Date();
		oneWeek.setDate(oneWeek.getDate() + 7);
		formSetFieldValueRef.current('dueDate', oneWeek.toISOString());
	}, [opened, assessments]);

	const canCreateDraft =
		!!form.values.assessmentNumber &&
		!!form.values.assessmentType &&
		!!form.values.dueDate;

	const createDraftMutation = useMutation({
		mutationFn: async () => {
			if (!form.values.dueDate) throw new Error('Due date is required');

			const typeLabel =
				ASSESSMENT_TYPES.find((t) => t.value === form.values.assessmentType)
					?.label || '';

			return createDraftAssignment({
				courseid: courseId,
				name: typeLabel,
				intro: form.values.description,
				allowsubmissionsfromdate: form.values.availableFrom
					? Math.floor(new Date(form.values.availableFrom).getTime() / 1000)
					: 0,
				duedate: Math.floor(new Date(form.values.dueDate).getTime() / 1000),
				activityinstructions: form.values.instructions,
				grademax: form.values.totalMarks,
			});
		},
		onSuccess: (result) => {
			setDraftId(result.assignmentId);
			setSaveState('saved');
			queryClient.invalidateQueries({
				queryKey: ['course-assignments', courseId],
			});
		},
		onError: (error) => {
			setSaveState('idle');
			notifications.show({
				message: error.message || 'Failed to create draft',
				color: 'red',
			});
		},
	});

	const saveSettingsMutation = useMutation({
		mutationFn: async () => {
			if (!draftId) return;

			const typeLabel =
				ASSESSMENT_TYPES.find((t) => t.value === form.values.assessmentType)
					?.label || '';

			await updateAssignment(draftId, {
				name: typeLabel,
				intro: form.values.description,
				activity: form.values.instructions,
				allowsubmissionsfromdate: form.values.availableFrom
					? Math.floor(new Date(form.values.availableFrom).getTime() / 1000)
					: 0,
				duedate: form.values.dueDate
					? Math.floor(new Date(form.values.dueDate).getTime() / 1000)
					: undefined,
				grademax: form.values.totalMarks,
			});
		},
		onSuccess: () => {
			setSaveState('saved');
		},
		onError: () => {
			setSaveState('saved');
		},
	});

	const triggerAutoSave = useCallback(() => {
		if (savingRef.current) return;
		if (!draftId) {
			if (canCreateDraft && !createDraftMutation.isPending) {
				setSaveState('saving');
				savingRef.current = true;
				createDraftMutation.mutate(undefined, {
					onSettled: () => {
						savingRef.current = false;
					},
				});
			}
			return;
		}
		setSaveState('saving');
		savingRef.current = true;
		saveSettingsMutation.mutate(undefined, {
			onSettled: () => {
				savingRef.current = false;
			},
		});
	}, [draftId, canCreateDraft, createDraftMutation, saveSettingsMutation]);

	const debouncedSave = useDebouncedCallback(triggerAutoSave, 1500);

	useEffect(() => {
		if (!opened) return;
		if (!canCreateDraft && !draftId) return;
		debouncedSave();
	}, [opened, canCreateDraft, draftId, debouncedSave]);

	const publishMutation = useMutation({
		mutationFn: async () => {
			if (!draftId) throw new Error('No draft assignment to publish');
			return publishAssignment({
				assignmentId: draftId,
				courseId,
				moduleId,
				assessmentNumber: form.values.assessmentNumber,
				weight: form.values.weight,
				totalMarks: form.values.totalMarks,
			});
		},
		onSuccess: () => {
			notifications.show({ message: 'Assignment published', color: 'green' });
			queryClient.invalidateQueries({
				queryKey: ['course-assignments', courseId],
			});
			queryClient.invalidateQueries({
				queryKey: ['module-assessments', moduleId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to publish assignment',
				color: 'red',
			});
		},
	});

	function handleClose() {
		if (draftId) {
			queryClient.invalidateQueries({
				queryKey: ['course-assignments', courseId],
			});
			queryClient.invalidateQueries({
				queryKey: ['module-assessments', moduleId],
			});
		}
		close();
	}

	return (
		<>
			<Button
				onClick={open}
				variant='light'
				leftSection={<IconPlus size={16} />}
				size='xs'
			>
				New Assignment
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title={
					<Group gap='sm'>
						<Text fw={600}>Create Assignment</Text>
						<DraftSaveBadge state={saveState} />
					</Group>
				}
				size='100%'
			>
				<Stack gap='md'>
					<Grid>
						<Grid.Col span={{ base: 12, md: 8 }}>
							<Grid>
								<Grid.Col span={6}>
									<Select
										label='Assignment Number'
										placeholder='Select assignment number'
										searchable
										clearable
										data={COURSE_WORK_OPTIONS}
										{...form.getInputProps('assessmentNumber')}
									/>
								</Grid.Col>
								<Grid.Col span={6}>
									<Select
										label='Assignment Type'
										placeholder='Select assignment type'
										searchable
										clearable
										data={ASSESSMENT_TYPES}
										{...form.getInputProps('assessmentType')}
									/>
								</Grid.Col>
							</Grid>
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<Grid mt={25}>
								<Grid.Col span={5}>
									<Button fullWidth variant='default' onClick={handleClose}>
										Save
									</Button>
								</Grid.Col>
								<Grid.Col span={7}>
									<Button
										fullWidth
										onClick={() => publishMutation.mutate()}
										loading={publishMutation.isPending}
										disabled={!draftId}
									>
										Publish
									</Button>
								</Grid.Col>
							</Grid>
						</Grid.Col>
					</Grid>

					<Grid>
						<Grid.Col span={{ base: 12, md: 8 }}>
							<Stack gap='md'>
								<ContentTabs form={form} />
								<AttachmentsSection form={form} />
							</Stack>
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<SettingsPanel form={form} />
						</Grid.Col>
					</Grid>
				</Stack>
			</Modal>
		</>
	);
}

type DraftSaveBadgeProps = {
	state: SaveState;
};

function DraftSaveBadge({ state }: DraftSaveBadgeProps) {
	if (state === 'idle') return null;

	if (state === 'saving') {
		return (
			<Badge
				variant='light'
				color='blue'
				size='sm'
				leftSection={<Loader size={10} color='blue' />}
			>
				Saving...
			</Badge>
		);
	}

	return (
		<Badge
			variant='light'
			color='green'
			size='sm'
			leftSection={<IconCheck size={12} />}
		>
			Saved as Draft
		</Badge>
	);
}
