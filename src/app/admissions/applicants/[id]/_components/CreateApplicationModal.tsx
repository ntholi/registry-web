'use client';

import { getEligibleProgramsForApplicant } from '@admissions/applicants/_server/actions';
import { createApplication } from '@admissions/applications/_server/actions';
import { findActiveIntakePeriod } from '@admissions/intake-periods/_server/actions';
import {
	Alert,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconFilePlus, IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect } from 'react';

const emptyValue = '';

type Props = {
	applicantId: string;
};

type ProgramOption = {
	value: string;
	label: string;
};

type ActiveIntakePeriod = {
	id: string;
	name: string;
};

type EligibleProgram = {
	id: number;
	code: string;
	name: string;
};

export default function CreateApplicationModal({ applicantId }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);

	const form = useForm({
		initialValues: {
			intakePeriodId: emptyValue,
			firstChoiceProgramId: emptyValue,
			secondChoiceProgramId: emptyValue,
		},
		validate: {
			intakePeriodId: (value) =>
				value ? null : 'Active intake period is required',
			firstChoiceProgramId: (value) =>
				value ? null : 'First choice is required',
		},
	});

	const { data: activeIntake, isLoading: loadingIntake } =
		useQuery<ActiveIntakePeriod | null>({
			queryKey: ['intake-periods', 'active', 'single'],
			queryFn: async () => (await findActiveIntakePeriod()) ?? null,
			enabled: opened,
		});

	const { data: eligiblePrograms = [], isLoading: loadingPrograms } = useQuery<
		EligibleProgram[]
	>({
		queryKey: ['eligible-programs', applicantId],
		queryFn: () => getEligibleProgramsForApplicant(applicantId),
		enabled: opened,
	});

	const createMutation = useMutation({
		mutationFn: async (values: typeof form.values) => {
			return createApplication({
				applicantId,
				intakePeriodId: values.intakePeriodId,
				firstChoiceProgramId: Number(values.firstChoiceProgramId),
				secondChoiceProgramId: values.secondChoiceProgramId
					? Number(values.secondChoiceProgramId)
					: null,
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Application created',
				color: 'green',
			});
			handleClose();
			router.refresh();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const programOptions: ProgramOption[] = eligiblePrograms.map((program) => ({
		value: program.id.toString(),
		label: `${program.code} - ${program.name}`,
	}));

	const secondChoiceOptions = programOptions.filter(
		(option) => option.value !== form.values.firstChoiceProgramId
	);

	function handleClose() {
		form.setValues({
			intakePeriodId: activeIntake?.id || emptyValue,
			firstChoiceProgramId: emptyValue,
			secondChoiceProgramId: emptyValue,
		});
		form.resetDirty();
		close();
	}

	function handleFirstChoiceChange(value: string | null) {
		const nextValue = value || emptyValue;
		form.setFieldValue('firstChoiceProgramId', nextValue);
		if (nextValue && form.values.secondChoiceProgramId === nextValue) {
			form.setFieldValue('secondChoiceProgramId', emptyValue);
		}
	}

	const hasActiveIntake = Boolean(activeIntake?.id);
	const noEligiblePrograms = programOptions.length === 0;

	useEffect(() => {
		if (!opened) return;
		const nextValue = activeIntake?.id || emptyValue;
		if (form.values.intakePeriodId !== nextValue) {
			form.setFieldValue('intakePeriodId', nextValue);
		}
	}, [
		activeIntake?.id,
		opened,
		form.values.intakePeriodId,
		form.setFieldValue,
	]);

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconFilePlus size={16} />}
				onClick={open}
			>
				New Application
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Create Application'
				size='lg'
				centered
			>
				<form
					onSubmit={form.onSubmit((values) => createMutation.mutate(values))}
				>
					<Stack gap='sm'>
						<Select
							label='Active Intake Period'
							data={
								activeIntake
									? [{ value: activeIntake.id, label: activeIntake.name }]
									: []
							}
							value={form.values.intakePeriodId}
							placeholder={
								hasActiveIntake
									? 'Active intake period'
									: 'No active intake period'
							}
							disabled
							error={form.errors.intakePeriodId}
							rightSection={loadingIntake ? '...' : undefined}
						/>

						<Select
							label='First Choice Program'
							placeholder='Select program'
							data={programOptions}
							searchable
							required
							value={form.values.firstChoiceProgramId}
							onChange={handleFirstChoiceChange}
							disabled={loadingPrograms || noEligiblePrograms}
							error={form.errors.firstChoiceProgramId}
							rightSection={loadingPrograms ? '...' : undefined}
						/>

						<Select
							label='Second Choice Program (Optional)'
							placeholder='Select program'
							data={secondChoiceOptions}
							searchable
							clearable
							value={form.values.secondChoiceProgramId}
							onChange={(value) =>
								form.setFieldValue('secondChoiceProgramId', value || emptyValue)
							}
							disabled={
								loadingPrograms ||
								noEligiblePrograms ||
								!form.values.firstChoiceProgramId
							}
						/>

						{!hasActiveIntake && (
							<Alert
								icon={<IconInfoCircle size={16} />}
								title='No active intake period'
								color='orange'
							>
								<Text size='sm'>
									Create an active intake period before submitting an
									application.
								</Text>
							</Alert>
						)}

						{hasActiveIntake && noEligiblePrograms && (
							<Alert
								icon={<IconInfoCircle size={16} />}
								title='No eligible programs'
								color='blue'
							>
								<Text size='sm'>
									No programs match the applicant’s current academic records.
								</Text>
							</Alert>
						)}

						<Group justify='flex-end' mt='sm'>
							<Button variant='default' onClick={handleClose}>
								Cancel
							</Button>
							<Button
								type='submit'
								loading={createMutation.isPending}
								disabled={
									!hasActiveIntake ||
									noEligiblePrograms ||
									createMutation.isPending
								}
							>
								Create Application
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
