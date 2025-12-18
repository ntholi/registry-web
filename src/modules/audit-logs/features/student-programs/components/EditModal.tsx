'use client';

import { getStructuresByProgramId } from '@academic/structures';
import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Loader,
	Modal,
	Select,
	Stack,
	Tabs,
	Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getAllTerms } from '@registry/terms';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
	programStatus,
	type StudentProgramStatus,
} from '@/modules/registry/database/schema/enums';
import AuditHistoryTab from '../../../components/AuditHistoryTab';
import {
	getStudentProgramAuditHistory,
	updateStudentProgram,
} from '../server/actions';

function parseDate(dateString: string | null): Date | null {
	if (!dateString) return null;
	const date = new Date(dateString);
	return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date | null | undefined): string | null {
	if (!date) return null;
	if (typeof date === 'string') return date;
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

interface StudentProgram {
	id: number;
	stdNo: number;
	intakeDate: string | null;
	regDate: string | null;
	startTerm: string | null;
	structureId: number;
	programId: number;
	graduationDate: string | null;
	status: StudentProgramStatus;
}

interface Props {
	program: StudentProgram;
}

const FIELD_LABELS = {
	status: 'Status',
	structureId: 'Structure',
	intakeDate: 'Intake Date',
	regDate: 'Registration Date',
	startTerm: 'Start Term',
	graduationDate: 'Graduation Date',
	programId: 'Program',
};

export default function EditStudentProgramModal({ program }: Props) {
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

	const { data: structuresData = [], isLoading: isLoadingStructures } =
		useQuery({
			queryKey: ['structures', program.programId],
			queryFn: () => getStructuresByProgramId(program.programId),
			enabled: opened,
			select: (data) =>
				data.map((s) => ({
					value: s.id.toString(),
					label: s.code,
				})),
		});

	const { data: historyData, isLoading: isLoadingHistory } = useQuery({
		queryKey: ['student-program-audit-history', program.id],
		queryFn: () => getStudentProgramAuditHistory(program.id),
		enabled: opened,
	});

	const form = useForm({
		initialValues: {
			intakeDate: parseDate(program.intakeDate),
			regDate: parseDate(program.regDate),
			startTerm: program.startTerm || '',
			structureId: program.structureId.toString(),
			graduationDate: parseDate(program.graduationDate),
			status: program.status,
			reasons: '',
		},
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				intakeDate: parseDate(program.intakeDate),
				regDate: parseDate(program.regDate),
				startTerm: program.startTerm || '',
				structureId: program.structureId.toString(),
				graduationDate: parseDate(program.graduationDate),
				status: program.status,
				reasons: '',
			});
			setShowReasonWarning(false);
			setPendingSubmit(false);
		}
	}, [opened, program, form.setValues]);

	const executeSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudentProgram(
					program.id,
					{
						intakeDate: formatDate(values.intakeDate),
						regDate: formatDate(values.regDate),
						startTerm: values.startTerm || null,
						structureId: parseInt(values.structureId, 10),
						graduationDate: formatDate(values.graduationDate),
						status: values.status as StudentProgramStatus,
					},
					values.reasons
				);

				notifications.show({
					title: 'Success',
					message: 'Student program updated successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({
					queryKey: ['student'],
				});
				queryClient.invalidateQueries({
					queryKey: ['student-program-audit-history', program.id],
				});

				form.reset();
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student program: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
				setShowReasonWarning(false);
				setPendingSubmit(false);
			}
		},
		[program.id, form, close, queryClient]
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
				style={{
					opacity: 0,
					transition: 'opacity 0.2s',
					cursor: 'pointer',
				}}
				className='edit-program-icon'
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title='Edit Student Program'
				size='lg'
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
							<Tabs.Tab value='history'>History</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Stack>
								<Select
									label='Status'
									placeholder='Select status'
									searchable
									clearable
									data={programStatus.enumValues.map((s) => ({
										value: s,
										label: s,
									}))}
									required
									{...form.getInputProps('status')}
								/>

								<Select
									label='Structure'
									placeholder='Select structure'
									searchable
									clearable
									data={structuresData}
									required
									disabled={isLoadingStructures}
									{...form.getInputProps('structureId')}
									rightSection={
										isLoadingStructures ? <Loader size='xs' /> : undefined
									}
								/>

								<Group grow>
									<DateInput
										label='Intake Date'
										firstDayOfWeek={0}
										placeholder='Select intake date'
										clearable
										valueFormat='YYYY-MM-DD'
										{...form.getInputProps('intakeDate')}
									/>
									<DateInput
										label='Registration Date'
										firstDayOfWeek={0}
										placeholder='Select registration date'
										clearable
										valueFormat='YYYY-MM-DD'
										{...form.getInputProps('regDate')}
									/>
								</Group>
								<Select
									label='Start Term'
									placeholder='Select start term'
									searchable
									clearable
									data={termsData}
									disabled={isLoadingTerms}
									{...form.getInputProps('startTerm')}
									rightSection={
										isLoadingTerms ? <Loader size='xs' /> : undefined
									}
								/>

								<DateInput
									label='Graduation Date'
									firstDayOfWeek={0}
									placeholder='Select graduation date'
									clearable
									valueFormat='YYYY-MM-DD'
									{...form.getInputProps('graduationDate')}
								/>
							</Stack>
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
								excludeFields={['stdNo']}
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
							disabled={isSubmitting || isLoadingTerms || isLoadingStructures}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							loading={isSubmitting}
							disabled={isLoadingTerms || isLoadingStructures}
						>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
