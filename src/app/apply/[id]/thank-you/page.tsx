import {
	Badge,
	Container,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconCheck,
	IconCreditCard,
} from '@tabler/icons-react';
import LinkButton from '@/shared/ui/ButtonLink';
import { getPaymentPageData } from '../(wizard)/payment/_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ThankYouPage({ params }: Props) {
	const { id } = await params;
	const data = await getPaymentPageData(id);
	const application = data?.application ?? null;
	const isPaid = data?.isPaid ?? false;
	const hasPendingDeposit = data?.hasPendingDeposit ?? false;
	const showPending = !isPaid && hasPendingDeposit;
	const gridCols = isPaid || showPending ? 1 : 2;

	return (
		<Container size='sm' py='xl'>
			<Paper withBorder p='xl'>
				<Stack align='center' gap='lg'>
					<ThemeIcon
						size={80}
						radius={50}
						color={isPaid ? 'green' : showPending ? 'blue' : 'orange'}
						variant='light'
					>
						{isPaid ? (
							<IconCheck size={48} />
						) : showPending ? (
							<IconCreditCard size={48} />
						) : (
							<IconAlertTriangle size={48} />
						)}
					</ThemeIcon>

					<Stack align='center' gap='xs'>
						<Title order={2}>
							{isPaid
								? 'Submitted'
								: showPending
									? 'Submitted'
									: 'Payment Required'}
						</Title>
						<Text c='dimmed' ta='center'>
							{isPaid
								? 'Thank you for applying to Limkokwing University'
								: showPending
									? 'Your application has been submitted and your payment is under verification.'
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
									<Badge
										size='xs'
										color={isPaid ? 'green' : showPending ? 'blue' : 'yellow'}
										variant='light'
									>
										{isPaid ? 'Paid' : showPending ? 'Submitted' : 'Pending'}
									</Badge>
								</Group>
							</Stack>
						</Paper>
					)}

					<SimpleGrid cols={gridCols} mt='md'>
						{isPaid ? (
							<LinkButton href='/apply/profile'>My Profile</LinkButton>
						) : showPending ? (
							<LinkButton href='/apply/profile'>My Profile</LinkButton>
						) : (
							<>
								<LinkButton href='/apply/profile' variant='light'>
									My Profile
								</LinkButton>
								<LinkButton
									href={`/apply/${id}/payment?method=receipt`}
									color='orange'
								>
									Pay Now
								</LinkButton>
							</>
						)}
					</SimpleGrid>
				</Stack>
			</Paper>
		</Container>
	);
}
