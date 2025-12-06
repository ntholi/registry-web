'use client';

import { Button, Grid, Modal, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { getAssessmentByModuleId } from '@/modules/academic/features/assessments/server/actions';
import {
	ASSESSMENT_TYPES,
	COURSE_WORK_OPTIONS,
} from '@/modules/academic/features/assessments/utils';
import { createAssignment } from '../../server/actions';
import AttachmentsSection from './AttachmentsSection';
import ContentTabs from './ContentTabs';
import SettingsPanel from './SettingsPanel';

const schema = z.object({
	assessmentNumber: z.string().min(1, 'Assessment number is required'),
	assessmentType: z.string().min(1, 'Assessment type is required'),
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

type AssessmentFormProps = {
	courseId: number;
	moduleId: number;
};

export default function AssessmentForm({
	courseId,
	moduleId,
}: AssessmentFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const { data: assessments } = useQuery({
		queryKey: ['module-assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
		enabled: opened,
	});

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
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

			const currentTotalWeight = assessments.reduce(
				(sum, a) => sum + a.weight,
				0
			);

			const remainingWeight = Math.max(0, 100 - currentTotalWeight);
			formSetFieldValueRef.current('weight', remainingWeight);
		} else {
			formSetFieldValueRef.current('assessmentNumber', 'CW1');
			formSetFieldValueRef.current('weight', 100);
		}
	}, [opened, assessments]);

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (!values.dueDate) {
				throw new Error('Due date is required');
			}

			const typeLabel =
				ASSESSMENT_TYPES.find((t) => t.value === values.assessmentType)
					?.label || '';

			return createAssignment({
				courseid: courseId,
				name: typeLabel,
				intro: values.description,
				allowsubmissionsfromdate: values.availableFrom
					? Math.floor(new Date(values.availableFrom).getTime() / 1000)
					: 0,
				duedate: Math.floor(new Date(values.dueDate).getTime() / 1000),
				activityinstructions: values.instructions,
				attachments: values.attachments,
				idnumber: values.assessmentNumber,
				grademax: values.totalMarks,
				moduleId,
				weight: values.weight,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Assignment created successfully',
				color: 'green',
			});
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
				message: error.message || 'Failed to create assignment',
				color: 'red',
			});
		},
	});

	const handleSubmit = form.onSubmit((values) => {
		mutation.mutate(values);
	});

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
				onClose={close}
				title='Create Assessment'
				size='100%'
			>
				<form onSubmit={handleSubmit}>
					<Stack gap='md'>
						<Grid>
							<Grid.Col span={{ base: 12, md: 8 }}>
								<Grid>
									<Grid.Col span={6}>
										<Select
											label='Assessment Number'
											placeholder='Select assessment number'
											searchable
											clearable
											data={COURSE_WORK_OPTIONS}
											{...form.getInputProps('assessmentNumber')}
										/>
									</Grid.Col>
									<Grid.Col span={6}>
										<Select
											label='Assessment Type'
											placeholder='Select assessment type'
											searchable
											clearable
											data={ASSESSMENT_TYPES}
											{...form.getInputProps('assessmentType')}
										/>
									</Grid.Col>
								</Grid>
							</Grid.Col>
							<Grid.Col span={{ base: 12, md: 4 }}>
								<Button
									type='submit'
									mt={25}
									loading={mutation.isPending}
									fullWidth
								>
									Create Assignment
								</Button>
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
				</form>
			</Modal>
		</>
	);
}
