import { Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconFileText, IconReceipt } from '@tabler/icons-react';
import type { graduationRequests, paymentReceipts } from '@/core/database';
import { formatDateTime } from '@/shared/lib/utils/utils';

type PaymentReceipt = typeof paymentReceipts.$inferSelect;
type GraduationRequest = typeof graduationRequests.$inferSelect & {
	paymentReceipts: PaymentReceipt[];
};

interface Props {
	graduationRequest: GraduationRequest;
}

export default function PaymentReceipts({ graduationRequest }: Props) {
	const getPaymentTypeColor = (type: string) => {
		switch (type) {
			case 'graduation_gown':
				return 'violet';
			case 'graduation_fee':
				return 'blue';
			default:
				return 'gray';
		}
	};

	const getPaymentTypeLabel = (type: string) => {
		switch (type) {
			case 'graduation_gown':
				return 'Graduation Gown';
			case 'graduation_fee':
				return 'Graduation Fee';
			default:
				return type;
		}
	};

	if (
		!graduationRequest.paymentReceipts ||
		graduationRequest.paymentReceipts.length === 0
	) {
		return (
			<Card shadow='sm' padding='xl' radius='md' withBorder>
				<Stack align='center' gap='md'>
					<IconFileText size={48} />
					<Stack align='center' gap='xs'>
						<Text fw={500} size='lg' c='dimmed'>
							No Payment Receipts
						</Text>
						<Text size='sm' c='dimmed' ta='center'>
							No payment receipts have been submitted for this graduation
							request yet.
						</Text>
					</Stack>
				</Stack>
			</Card>
		);
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }}>
			{graduationRequest.paymentReceipts.map((receipt: PaymentReceipt) => (
				<Card withBorder key={receipt.id}>
					<Group justify='space-between' mb='xs'>
						<Group>
							<ThemeIcon
								color={getPaymentTypeColor(receipt.paymentType)}
								variant='light'
								size='sm'
							>
								<IconReceipt size='1rem' />
							</ThemeIcon>
							<Text fw={500} size='sm'>
								{getPaymentTypeLabel(receipt.paymentType)}
							</Text>
						</Group>
					</Group>

					<Text size='sm' c='dimmed' mb='xs'>
						Receipt No:{' '}
						<Text span fw={500}>
							{receipt.receiptNo}
						</Text>
					</Text>

					<Text size='xs' c='dimmed'>
						Submitted: {formatDateTime(receipt.createdAt)}
					</Text>
				</Card>
			))}
		</SimpleGrid>
	);
}
