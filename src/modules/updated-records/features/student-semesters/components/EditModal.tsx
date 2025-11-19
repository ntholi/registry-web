'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Select,
	Tabs,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
	type SemesterStatus,
	semesterStatus,
} from '@/modules/registry/database/schema/enums';
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
}

export default function EditStudentSemesterModal({
	semester,
	structureId,
}: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [sponsors, setSponsors] = useState<{ value: string; label: string }[]>(
		[]
	);
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
	}, [opened, semester]);

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
				close();
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
		[semester.id, form, close, queryClient]
	);

	return (
		<>
			<ActionIcon
				size='sm'
				variant='subtle'
				color='gray'
				onClick={open}
				style={{
					opacity: 0,
					transition: 'opacity 0.2s',
				}}
				className='edit-semester-icon'
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
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
								data={semesterStatus.enumValues.map((s) => ({
									value: s,
									label: s,
								}))}
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
						<Button variant='outline' onClick={close} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' loading={isSubmitting}>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
