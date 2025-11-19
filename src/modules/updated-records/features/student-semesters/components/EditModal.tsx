'use client';

import { Button, Group, Modal, Select, Tabs, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import type { SemesterStatus } from '@/core/database';
import { semesterStatus } from '@/core/database';
import {
	getAllSponsors,
	getStructureSemestersByStructureId,
	updateStudentSemester,
} from '../server/actions';

interface StudentSemester {
	id: number;
	term: string;
	structureSemesterId: number;
	status: SemesterStatus;
	sponsorId: number | null;
	studentProgramId: number;
}

interface Props {
	semester: StudentSemester;
	structureId: number;
	opened: boolean;
	onClose: () => void;
}

export default function EditStudentSemesterModal({
	semester,
	structureId,
	opened,
	onClose,
}: Props) {
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [sponsors, setSponsors] = useState<{ value: string; label: string }[]>([]);
	const [structureSemesters, setStructureSemesters] = useState<
		{ value: string; label: string }[]
	>([]);

	const form = useForm({
		initialValues: {
			term: semester.term,
			status: semester.status,
			structureSemesterId: semester.structureSemesterId.toString(),
			sponsorId: semester.sponsorId?.toString() || '',
			reasons: '',
		},
	});

	useEffect(() => {
		if (!opened) return;

		async function loadData() {
			try {
				const [sponsorsData, structureSemestersData] = await Promise.all([
					getAllSponsors(),
					getStructureSemestersByStructureId(structureId),
				]);

				setSponsors(
					sponsorsData.map((s) => ({
						value: s.id.toString(),
						label: `${s.name} (${s.code})`,
					}))
				);

				setStructureSemesters(
					structureSemestersData.map((s) => ({
						value: s.id.toString(),
						label: s.name,
					}))
				);
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: 'Failed to load data for the form',
					color: 'red',
				});
			}
		}

		loadData();
	}, [opened, structureId]);

	useEffect(() => {
		if (opened) {
			form.setValues({
				term: semester.term,
				status: semester.status,
				structureSemesterId: semester.structureSemesterId.toString(),
				sponsorId: semester.sponsorId?.toString() || '',
				reasons: '',
			});
		}
	}, [opened, semester, form]);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudentSemester(
					semester.id,
					{
						term: values.term,
						status: values.status as SemesterStatus,
						structureSemesterId: parseInt(values.structureSemesterId),
						sponsorId: values.sponsorId ? parseInt(values.sponsorId) : null,
					},
					values.reasons
				);

				notifications.show({
					title: 'Success',
					message: 'Student semester updated successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({
					queryKey: ['student'],
				});

				form.reset();
				onClose();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student semester: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[semester.id, form, onClose, queryClient]
	);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Edit Student Semester'
			size='md'
		>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Tabs defaultValue='details'>
					<Tabs.List>
						<Tabs.Tab value='details'>Details</Tabs.Tab>
						<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='details' pt='md'>
						<TextInput
							label='Term'
							placeholder='Enter term'
							required
							mb='md'
							{...form.getInputProps('term')}
						/>

						<Select
							label='Status'
							placeholder='Select status'
							searchable
							clearable
							data={semesterStatus.enumValues.map((s) => ({ value: s, label: s }))}
							required
							mb='md'
							{...form.getInputProps('status')}
						/>

						<Select
							label='Structure Semester'
							placeholder='Select structure semester'
							searchable
							clearable
							data={structureSemesters}
							required
							mb='md'
							{...form.getInputProps('structureSemesterId')}
						/>

						<Select
							label='Sponsor'
							placeholder='Select sponsor (optional)'
							searchable
							clearable
							data={sponsors}
							mb='md'
							{...form.getInputProps('sponsorId')}
						/>
					</Tabs.Panel>

					<Tabs.Panel value='reasons' pt='md'>
						<Textarea
							label='Reasons for Update'
							placeholder='Enter the reason for this update (optional)'
							rows={6}
							{...form.getInputProps('reasons')}
						/>
					</Tabs.Panel>
				</Tabs>

				<Group justify='flex-end' mt='md'>
					<Button variant='outline' onClick={onClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type='submit' loading={isSubmitting}>
						Update
					</Button>
				</Group>
			</form>
		</Modal>
	);
}
