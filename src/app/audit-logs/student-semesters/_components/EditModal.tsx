'use client';

import { getStructureSemestersByStructureId } from '@academic/schools/structures/_server/actions';
import { getAllSponsors } from '@finance/sponsors';
import {
	ActionIcon,
	Alert,
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
import {
	type SemesterStatus,
	semesterStatus,
} from '@registry/_database/schema/enums';
import { getAllTerms } from '@registry/dates/terms';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import AuditHistoryTab from '../../_components/AuditHistoryTab';
import {
	getStudentSemesterAuditHistory,
	updateStudentSemester,
} from '../_server/actions';

interface StudentSemester {
	id: number;
	termCode: string;
	structureSemesterId: number;
	status: SemesterStatus;
	sponsorId: number | null;
	studentProgramId: number;
}

interface Props {
	semester: StudentSemester;
	structureId: number;
}

const FIELD_LABELS = {
	termCode: 'Term',
	status: 'Status',
	structureSemesterId: 'Structure Semester',
	sponsorId: 'Sponsor',
	studentProgramId: 'Student Program',
};

export default function EditStudentSemesterModal({
	semester,
	structureId,
}: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showReasonWarning, setShowReasonWarning] = useState(false);
	const [pendingSubmit, setPendingSubmit] = useState(false);

	const { data: termsData = [], isLoading: isLoadingTerms } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
		enabled: opened,
		select: (data) =>
			data.map((t) => ({
				value: t.code,
				label: t.code,
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

	const { data: historyData, isLoading: isLoadingHistory } = useQuery({
		queryKey: ['student-semester-audit-history', semester.id],
		queryFn: () => getStudentSemesterAuditHistory(semester.id),
		enabled: opened,
	});

	const form = useForm({
		initialValues: {
			termCode: semester.termCode,
			status: semester.status,
			structureSemesterId: semester.structureSemesterId.toString(),
			sponsorId: semester.sponsorId?.toString() || '',
			reasons: '',
		},
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				termCode: semester.termCode,
				status: semester.status,
				structureSemesterId: semester.structureSemesterId.toString(),
				sponsorId: semester.sponsorId?.toString() || '',
				reasons: '',
			});
			setShowReasonWarning(false);
			setPendingSubmit(false);
		}
	}, [opened, semester, form.setValues]);

	const executeSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudentSemester(
					semester.id,
					{
						termCode: values.termCode,
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
				queryClient.invalidateQueries({
					queryKey: ['student-semester-audit-history', semester.id],
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
				setShowReasonWarning(false);
				setPendingSubmit(false);
			}
		},
		[semester.id, form, close, queryClient]
	);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			if (!values.reasons.trim() && !pendingSubmit) {
				setShowReasonWarning(true);
				setPendingSubmit(true);
				return;
			}
			await executeSubmit(values);
		},
		[executeSubmit, pendingSubmit]
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
							<Tabs.Tab value='history'>History</Tabs.Tab>
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
								{...form.getInputProps('termCode')}
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

						<Tabs.Panel value='history' pt='md'>
							<AuditHistoryTab
								data={historyData}
								isLoading={isLoadingHistory}
								fieldLabels={FIELD_LABELS}
							/>
						</Tabs.Panel>
					</Tabs>

					{showReasonWarning && (
						<Alert
							icon={<IconAlertCircle size={16} />}
							color='yellow'
							mt='md'
							variant='light'
						>
							You have not provided a reason for this update. Provide the reason
							then click Update to proceed.
						</Alert>
					)}

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
