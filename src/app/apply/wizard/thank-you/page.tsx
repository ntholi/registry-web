import { findApplicationsByApplicant } from '@admissions/applications';
import {
	Badge,
	Button,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconCheck, IconHome } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ThankYouPage({ params }: Props) {
	const { id } = await params;
	const applications = await findApplicationsByApplicant(id);

	const application = applications.find(
		(app: { status: string }) =>
			app.status === 'submitted' || app.status === 'draft'
	);

	const isPaid = application?.paymentStatus === 'paid';

	return (
		<Container size='sm' py='xl'>
			<Paper withBorder radius='lg' p='xl'>
				<Stack align='center' gap='lg'>
					<ThemeIcon size={80} radius='xl' color='green' variant='light'>
						<IconCheck size={48} />
					</ThemeIcon>

					<Stack align='center' gap='xs'>
						<Title order={2}>Application Submitted</Title>
						<Text c='dimmed' ta='center'>
							Thank you for applying to Limkokwing University
						</Text>
					</Stack>

					{application && (
						<Paper withBorder p='md' radius='md' w='100%'>
							<Stack gap='sm'>
								<Group justify='space-between'>
									<Text size='sm' c='dimmed'>
										Application Reference
									</Text>
									<Text size='sm' fw={500} ff='monospace'>
										{application.id}
									</Text>
								</Group>
								<Group justify='space-between'>
									<Text size='sm' c='dimmed'>
										Payment Status
									</Text>
									<Badge color={isPaid ? 'green' : 'yellow'} variant='light'>
										{isPaid ? 'Paid' : 'Pending'}
									</Badge>
								</Group>
							</Stack>
						</Paper>
					)}

					<Text size='sm' c='dimmed' ta='center'>
						{isPaid
							? 'Your application is being reviewed. You will be notified of the outcome via email.'
							: 'Please complete your payment to finalize your application.'}
					</Text>

					<Group mt='md'>
						<Button
							component={Link}
							href='/apply'
							variant='light'
							leftSection={<IconHome size={16} />}
						>
							Back to Dashboard
						</Button>
						{!isPaid && (
							<Button component={Link} href={`/apply/${id}/payment`}>
								Complete Payment
							</Button>
						)}
					</Group>
				</Stack>
			</Paper>
		</Container>
	);
}
