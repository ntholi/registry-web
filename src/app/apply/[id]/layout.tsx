import { canCurrentUserApply } from '@admissions/applicants';
import { Box, Container } from '@mantine/core';
import { redirect } from 'next/navigation';
import { ApplyHeader } from '../_components/ApplyHeader';

type Props = {
	children: React.ReactNode;
};

export default async function ApplyLayout({ children }: Props) {
	const eligibility = await canCurrentUserApply();
	if (!eligibility.canApply) {
		redirect('/apply/restricted');
	}

	return (
		<Box
			mih='100vh'
			bg='light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))'
		>
			<ApplyHeader />
			<Container size='lg' py='xl' pt={100}>
				{children}
			</Container>
		</Box>
	);
}
