'use client';

import { getAllSponsors } from '@finance/sponsors';
import {
	ActionIcon,
	Button,
	Group,
	Loader,
	Modal,
	Select,
	Tabs,
	Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getAllTerms } from '@registry/terms';
import { IconEdit } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
	type SemesterStatus,
	semesterStatus,
} from '@/modules/registry/database/schema/enums';
import {
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

	const { data: termsData = [], isLoading: isLoadingTerms } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
		enabled: opened,
		select: (data) =>
			data.map((t) => ({
				value: t.name,
				label: t.name,
			})),
	});

	const { data: sponsorsData = [], isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: getAllSponsors,
		enabled: opened,
		select: (data) =>
			data.map((s) => ({
				value: s.id.toString(),
				label: s.name,
			})),
	});

	const {
		data: structureSemestersData = [],
		isLoading: isLoadingStructureSemesters,
	} = useQuery({
		queryKey: ['structure-semesters', structureId],
		queryFn: () => getStructureSemestersByStructureId(structureId),
		enabled: opened,
		select: (data) =>
			data.map((s) => ({
				value: s.id.toString(),
				label: s.name,
			})),
	});

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
		if (opened) {
			form.setValues({
				term: semester.term,
				status: semester.status,
				structureSemesterId: semester.structureSemesterId.toString(),
				sponsorId: semester.sponsorId?.toString() || '',
				reasons: '',
			});
		}
	}, [opened, semester, form.setValues]);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudentSemester(
					semester.id,
					{
						term: values.term,
						status: values.status as SemesterStatus,
						structureSemesterId: parseInt(values.structureSemesterId, 10),
						sponsorId: values.sponsorId ? parseInt(values.sponsorId, 10) : null,
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
				component='div'
				size='sm'
				variant='subtle'
				color='gray'
				onClick={(e) => {
					e.stopPropagation();
					open();
				}}
				style={{
					opacity: 0,
					transition: 'opacity 0.2s',
					cursor: 'pointer',
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
							<Select
								label='Term'
								placeholder='Select term'
								searchable
								clearable
								data={termsData}
								required
								mb='md'
								disabled={isLoadingTerms}
								{...form.getInputProps('term')}
								rightSection={isLoadingTerms ? <Loader size='xs' /> : undefined}
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
								data={structureSemestersData}
								required
								mb='md'
								disabled={isLoadingStructureSemesters}
								{...form.getInputProps('structureSemesterId')}
								rightSection={
									isLoadingStructureSemesters ? <Loader size='xs' /> : undefined
								}
							/>

							<Select
								label='Sponsor'
								placeholder='Select sponsor (optional)'
								searchable
								clearable
								data={sponsorsData}
								mb='md'
								disabled={isLoadingSponsors}
								{...form.getInputProps('sponsorId')}
								rightSection={
									isLoadingSponsors ? <Loader size='xs' /> : undefined
								}
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
						<Button
							variant='outline'
							onClick={close}
							disabled={
								isSubmitting ||
								isLoadingTerms ||
								isLoadingSponsors ||
								isLoadingStructureSemesters
							}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							loading={isSubmitting}
							disabled={
								isLoadingTerms ||
								isLoadingSponsors ||
								isLoadingStructureSemesters
							}
						>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
