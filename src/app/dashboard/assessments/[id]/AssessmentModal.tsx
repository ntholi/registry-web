'use client';

import { Button, Group, Modal, NumberInput, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useCallback, useEffect, useState } from 'react';
import { type assessmentNumberEnum, assessments } from '@/db/schema';
import { createAssessment, updateAssessment } from '@/server/assessments/actions';
import type { getModule } from '@/server/modules/actions';
import { ASSESSMENT_TYPES, COURSE_WORK_OPTIONS } from './assessments';

type AssessmentNumberType = (typeof assessmentNumberEnum.enumValues)[number];
type Assessment = NonNullable<Awaited<ReturnType<typeof getModule>>>['assessments'][number];

const schema = createInsertSchema(assessments);

interface Props {
	moduleId: number;
	assessment?: Assessment;
	opened: boolean;
	onClose: () => void;
}

export default function AssessmentModal({ moduleId, assessment, opened, onClose }: Props) {
	const queryClient = useQueryClient();
	const isEditing = !!assessment;
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm({
		initialValues: {
			assessmentNumber: assessment?.assessmentNumber || ('' as AssessmentNumberType),
			assessmentType: assessment?.assessmentType || '',
			totalMarks: assessment?.totalMarks || 100,
			weight: assessment?.weight || 0,
		},
		validate: zodResolver(
			schema.pick({
				assessmentNumber: true,
				assessmentType: true,
				totalMarks: true,
				weight: true,
			})
		),
	});
	useEffect(() => {
		if (!opened) return;

		if (isEditing && assessment) {
			form.setValues({
				assessmentNumber: assessment.assessmentNumber,
				assessmentType: assessment.assessmentType,
				totalMarks: assessment.totalMarks,
				weight: assessment.weight,
			});
		} else if (!isEditing) {
			form.reset();

			const moduleData = queryClient.getQueryData<{
				assessments: Assessment[];
			}>(['module', moduleId]);

			if (moduleData?.assessments && moduleData.assessments.length > 0) {
				const assessmentNumbers = moduleData.assessments.map((a) => {
					const match = a.assessmentNumber.match(/CW(\d+)/);
					return match ? parseInt(match[1], 10) : 0;
				});

				const highestNumber = Math.max(...assessmentNumbers);

				const nextNumber = highestNumber + 1;
				if (nextNumber <= 15) {
					form.setFieldValue('assessmentNumber', `CW${nextNumber}` as AssessmentNumberType);
				}

				const currentTotalWeight = moduleData.assessments.reduce((sum, a) => sum + a.weight, 0);

				const remainingWeight = Math.max(0, 100 - currentTotalWeight);
				form.setFieldValue('weight', remainingWeight);
			}
		}
	}, [
		opened,
		isEditing,
		moduleId,
		queryClient,
		assessment,
		form.reset,
		form.setFieldValue,
		form.setValues,
	]);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				const moduleData = queryClient.getQueryData<{
					assessments: Assessment[];
				}>(['module', moduleId]);

				if (moduleData?.assessments) {
					const currentTotalWeight = moduleData.assessments.reduce((sum, a) => {
						if (isEditing && assessment && a.id === assessment.id) {
							return sum;
						}
						return sum + a.weight;
					}, 0);

					const newTotalWeight = currentTotalWeight + values.weight;

					if (newTotalWeight > 100) {
						notifications.show({
							title: 'Validation Error',
							message: `Total assessment weight cannot exceed 100%. Current total: ${currentTotalWeight}%, Attempting to add: ${values.weight}%`,
							color: 'red',
						});
						return;
					}
				}

				if (isEditing && assessment) {
					await updateAssessment(assessment.id, {
						...values,
						assessmentNumber: values.assessmentNumber as AssessmentNumberType,
						moduleId,
						termId: assessment.termId,
					});
					notifications.show({
						title: 'Success',
						message: 'Assessment updated successfully',
						color: 'green',
					});
				} else {
					await createAssessment({
						...values,
						assessmentNumber: values.assessmentNumber as AssessmentNumberType,
						moduleId,
						termId: 0,
					});
					notifications.show({
						title: 'Success',
						message: 'Assessment created successfully',
						color: 'green',
					});
				}

				queryClient.invalidateQueries({
					queryKey: ['module', moduleId],
				});

				queryClient.invalidateQueries({
					queryKey: ['modules'],
				});

				form.reset();
				onClose();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `An error occurred while saving the assessment: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[assessment, form, isEditing, moduleId, onClose, queryClient]
	);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEditing ? 'Edit Assessment' : 'Add Assessment'}
			size="md"
		>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Select
					label="Assessment Number"
					placeholder="Select assessment number"
					searchable
					clearable
					data={COURSE_WORK_OPTIONS}
					required
					mb="md"
					{...form.getInputProps('assessmentNumber')}
				/>
				<Select
					label="Assessment Type"
					placeholder="Search or select an assessment type"
					searchable
					clearable
					data={ASSESSMENT_TYPES}
					{...form.getInputProps('assessmentType')}
					required
					mb="md"
				/>
				<NumberInput
					label="Total Marks"
					placeholder="Total marks for this assessment"
					required
					mb="md"
					min={1}
					{...form.getInputProps('totalMarks')}
				/>
				<NumberInput
					label="Weight (%)"
					placeholder="Weight of this assessment"
					required
					mb="md"
					min={0}
					max={100}
					{...form.getInputProps('weight')}
				/>
				<Group justify="flex-end" mt="md">
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" loading={isSubmitting}>
						{isEditing ? 'Update' : 'Create'}
					</Button>
				</Group>
			</form>
		</Modal>
	);
}
