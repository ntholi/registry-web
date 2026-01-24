'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import {
	Divider,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Textarea,
	TextInput,
	Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import WizardNavigation from '../../../_components/WizardNavigation';
import { updateApplicantInfo } from '../_server/actions';
import GuardianManager from './GuardianManager';
import PhoneManager from './PhoneManager';

type Props = {
	applicant: ApplicantWithRelations;
};

const genderOptions = [
	{ value: 'Male', label: 'Male' },
	{ value: 'Female', label: 'Female' },
];

export default function PersonalInfoForm({ applicant }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm({
		mode: 'uncontrolled',
		initialValues: {
			fullName: applicant.fullName ?? '',
			dateOfBirth: applicant.dateOfBirth ?? '',
			nationalId: applicant.nationalId ?? '',
			nationality: applicant.nationality ?? '',
			gender: applicant.gender ?? '',
			birthPlace: applicant.birthPlace ?? '',
			religion: applicant.religion ?? '',
			address: applicant.address ?? '',
		},
		validate: {
			fullName: (value) => (value ? null : 'Full name is required'),
		},
	});

	const mutation = useMutation({
		mutationFn: (values: typeof form.values) =>
			updateApplicantInfo(applicant.id, values),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applicants'] });
			notifications.show({
				title: 'Information saved',
				message: 'Your personal information has been updated',
				color: 'green',
			});
			router.push(`/apply/${applicant.id}/review`);
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	return (
		<Stack gap='lg'>
			<Paper withBorder radius='md' p='lg'>
				<form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
					<Stack gap='md'>
						<Title order={3}>Personal Information</Title>
						<TextInput
							label='Full Name'
							placeholder='Enter full name'
							required
							key={form.key('fullName')}
							{...form.getInputProps('fullName')}
						/>
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<DateInput
								label='Date of Birth'
								placeholder='Select date of birth'
								valueFormat='YYYY-MM-DD'
								key={form.key('dateOfBirth')}
								{...form.getInputProps('dateOfBirth')}
							/>
							<Select
								label='Gender'
								placeholder='Select gender'
								data={genderOptions}
								key={form.key('gender')}
								{...form.getInputProps('gender')}
							/>
						</SimpleGrid>
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<TextInput
								label='National ID'
								placeholder='Enter national ID'
								key={form.key('nationalId')}
								{...form.getInputProps('nationalId')}
							/>
							<TextInput
								label='Nationality'
								placeholder='Enter nationality'
								key={form.key('nationality')}
								{...form.getInputProps('nationality')}
							/>
						</SimpleGrid>
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<TextInput
								label='Birth Place'
								placeholder='Enter birth place'
								key={form.key('birthPlace')}
								{...form.getInputProps('birthPlace')}
							/>
							<TextInput
								label='Religion'
								placeholder='Enter religion'
								key={form.key('religion')}
								{...form.getInputProps('religion')}
							/>
						</SimpleGrid>
						<Textarea
							label='Address'
							description='Residential or physical address'
							placeholder='Enter address'
							rows={2}
							key={form.key('address')}
							{...form.getInputProps('address')}
						/>
					</Stack>
				</form>
			</Paper>

			<Paper withBorder radius='md' p='lg'>
				<Stack gap='md'>
					<Title order={3}>Phone Numbers</Title>
					<PhoneManager applicantId={applicant.id} phones={applicant.phones} />
				</Stack>
			</Paper>

			<Paper withBorder radius='md' p='lg'>
				<Stack gap='md'>
					<Title order={3}>Guardians</Title>
					<GuardianManager
						applicantId={applicant.id}
						guardians={applicant.guardians}
					/>
				</Stack>
			</Paper>

			<Divider />

			<WizardNavigation
				applicantId={applicant.id}
				backPath={`/apply/${applicant.id}/program`}
				onNext={() => form.onSubmit((values) => mutation.mutate(values))()}
				nextDisabled={applicant.guardians.length === 0}
				nextLoading={mutation.isPending}
			/>
		</Stack>
	);
}
