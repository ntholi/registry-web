'use client';

import { getAllSchools, getProgramsBySchoolId } from '@academic/schools';
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
import { programStatus, type StudentProgramStatus } from '@registry/_database';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { getActiveTerm, getAllTerms } from '@/app/registry/terms';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import { createStudentProgram } from '../_server/actions';

interface Props {
	stdNo: number;
	defaultSchoolId?: number | null;
	visible?: boolean;
}

export default function CreateStudentProgramModal({
	stdNo,
	defaultSchoolId,
	visible = true,
}: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showReasonWarning, setShowReasonWarning] = useState(false);
	const [pendingSubmit, setPendingSubmit] = useState(false);

	const { refetch: refetchActiveTerm } = useQuery({
		queryKey: ['active-term'],
		queryFn: getActiveTerm,
		enabled: false,
	});

	const form = useForm({
		initialValues: {
			schoolId: '',
			programId: '',
			structureId: '',
			intakeDate: null as Date | null,
			regDate: null as Date | null,
			startTerm: '',
			graduationDate: null as Date | null,
			status: 'Active' as StudentProgramStatus,
			reasons: '',
		},
	});

	const selectedSchoolId = useMemo(() => {
		const val = Number(form.values.schoolId);
		return Number.isFinite(val) && val > 0 ? val : null;
	}, [form.values.schoolId]);

	const selectedProgramId = useMemo(() => {
		const val = Number(form.values.programId);
		return Number.isFinite(val) && val > 0 ? val : null;
	}, [form.values.programId]);

	const { data: schoolsData = [], isLoading: isLoadingSchools } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		enabled: opened,
		select: (data) =>
			data.map((s) => ({
				value: s.id.toString(),
				label: s.name,
			})),
	});

	const { data: programsData = [], isLoading: isLoadingPrograms } = useQuery({
		queryKey: ['programs', selectedSchoolId],
		queryFn: () =>
			selectedSchoolId ? getProgramsBySchoolId(selectedSchoolId) : [],
		enabled: opened && !!selectedSchoolId,
		select: (data) =>
			data.map((p) => ({
				value: p.id.toString(),
				label: p.name,
			})),
	});

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
			queryKey: ['structures', selectedProgramId],
			queryFn: () =>
				selectedProgramId ? getStructuresByProgramId(selectedProgramId) : [],
			enabled: opened && !!selectedProgramId,
			select: (data) =>
				data.map((s) => ({
					value: s.id.toString(),
					label: s.code,
				})),
		});

	const executeSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await createStudentProgram(
					{
						stdNo,
						intakeDate: formatDateToISO(values.intakeDate) || null,
						regDate: formatDateToISO(values.regDate) || null,
						startTerm: values.startTerm || null,
						structureId: Number(values.structureId),
						graduationDate: formatDateToISO(values.graduationDate) || null,
						status: values.status as StudentProgramStatus,
					},
					values.reasons
				);

				notifications.show({
					title: 'Success',
					message: 'Student program created successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({ queryKey: ['student'] });
				form.reset();
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to create student program: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
				setShowReasonWarning(false);
				setPendingSubmit(false);
			}
		},
		[stdNo, form, close, queryClient]
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
					form.reset();
					setShowReasonWarning(false);
					setPendingSubmit(false);
					form.setFieldValue(
						'schoolId',
						defaultSchoolId ? defaultSchoolId.toString() : ''
					);
					form.setFieldValue('intakeDate', new Date());
					void refetchActiveTerm().then((res) => {
						if (res.data?.code) {
							form.setFieldValue('startTerm', res.data.code);
						}
					});
					open();
				}}
				style={{
					opacity: visible ? 1 : 0,
					transition: 'opacity 0.2s',
				}}
			>
				<IconPlus size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title='Create Student Program'
				size='lg'
				onClick={(e) => e.stopPropagation()}
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Stack>
								<Select
									label='School'
									placeholder='Select school'
									searchable
									clearable
									data={schoolsData}
									disabled={isLoadingSchools}
									{...form.getInputProps('schoolId')}
									onChange={(value) => {
										form.setFieldValue('schoolId', value || '');
										form.setFieldValue('programId', '');
										form.setFieldValue('structureId', '');
									}}
									rightSection={
										isLoadingSchools ? <Loader size='xs' /> : undefined
									}
								/>

								<Select
									label='Program'
									placeholder='Select program'
									searchable
									clearable
									data={programsData}
									disabled={!selectedSchoolId || isLoadingPrograms}
									{...form.getInputProps('programId')}
									onChange={(value) => {
										form.setFieldValue('programId', value || '');
										form.setFieldValue('structureId', '');
									}}
									rightSection={
										isLoadingPrograms ? <Loader size='xs' /> : undefined
									}
								/>

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
									disabled={!selectedProgramId || isLoadingStructures}
									{...form.getInputProps('structureId')}
									rightSection={
										isLoadingStructures ? <Loader size='xs' /> : undefined
									}
								/>

								<Group grow>
									<DateInput
										label='Intake Date'
										placeholder='Select intake date'
										clearable
										{...form.getInputProps('intakeDate')}
									/>
									<DateInput
										label='Registration Date'
										placeholder='Select registration date'
										clearable
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
									placeholder='Select graduation date'
									clearable
									{...form.getInputProps('graduationDate')}
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='reasons' pt='md'>
							<Textarea
								label='Reasons'
								placeholder='Enter the reason for this change (optional)'
								rows={6}
								{...form.getInputProps('reasons')}
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
							You have not provided a reason for this change. Provide the reason
							then click Create to proceed.
						</Alert>
					)}

					<Group justify='flex-end' mt='md'>
						<Button
							variant='outline'
							onClick={close}
							disabled={
								isSubmitting ||
								isLoadingSchools ||
								isLoadingPrograms ||
								isLoadingTerms ||
								isLoadingStructures
							}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							loading={isSubmitting}
							disabled={
								isLoadingSchools ||
								isLoadingPrograms ||
								isLoadingTerms ||
								isLoadingStructures
							}
						>
							Create
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
