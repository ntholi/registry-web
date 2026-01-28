import { Stack } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getApplicant } from '../_server/actions';
import ApplicantHeader from './_components/ApplicantHeader';
import ApplicantTabs from './_components/ApplicantTabs';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ApplicantDetails({ params }: Props) {
	const { id } = await params;
	const item = await getApplicant(id);

	if (!item) {
		return notFound();
	}

	return (
		<Stack gap='lg' p={{ base: 'sm', md: 'lg' }}>
			<ApplicantHeader
				id={item.id}
				fullName={item.fullName}
				gender={item.gender}
				nationalId={item.nationalId}
			/>

			<ApplicantTabs applicant={item} />
		</Stack>
	);
}
