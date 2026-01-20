import { getApplicant } from '@admissions/applicants/_server/actions';
import { Paper, Stack, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import PersonalInfoForm from './_components/PersonalInfoForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PersonalInfoPage({ params }: Props) {
	const { id } = await params;
	const applicant = await getApplicant(id);

	if (!applicant) {
		notFound();
	}

	return (
		<Stack gap='lg'>
			<Title order={2}>Personal Information</Title>
			<Paper withBorder p='lg' radius='md'>
				<PersonalInfoForm applicant={applicant} />
			</Paper>
		</Stack>
	);
}
