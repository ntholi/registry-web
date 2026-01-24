import { getApplication } from '@admissions/applications';
import {
	Badge,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconCheck,
	IconCreditCard,
	IconHome,
} from '@tabler/icons-react';
import LinkButton from '@/shared/ui/ButtonLink';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ThankYouPage({ params }: Props) {
	const { id } = await params;
	const application = await getApplication(id);

	const isPaid = application?.paymentStatus === 'paid';

	return (
		<Container size='sm' py='xl'>
			<Paper withBorder p='xl'>
				<Stack align='center' gap='lg'>
					<ThemeIcon
						size={80}
						radius={50}
						color={isPaid ? 'green' : 'orange'}
						variant='light'
					>
						{isPaid ? <IconCheck size={48} /> : <IconAlertTriangle size={48} />}
					</ThemeIcon>

					<Stack align='center' gap='xs'>
						<Title order={2}>
							{isPaid ? 'Application Submitted' : 'Payment Required'}
						</Title>
						<Text c='dimmed' ta='center'>
							{isPaid
								? 'Thank you for applying to Limkokwing University'
								: 'Your application has been saved but requires payment to be processed'}
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
						{isPaid ? (
							<LinkButton
								href='/apply/profile'
								leftSection={<IconHome size={16} />}
							>
								My Profile
							</LinkButton>
						) : (
							<>
								<LinkButton
									href='/apply/profile'
									variant='light'
									leftSection={<IconHome size={16} />}
								>
									My Profile
								</LinkButton>
								<LinkButton
									href={`/apply/${id}/payment`}
									color='orange'
									leftSection={<IconCreditCard size={16} />}
								>
									Pay Now
								</LinkButton>
							</>
						)}
					</Group>
				</Stack>
			</Paper>
		</Container>
	);
}
