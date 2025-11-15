'use client';

import { getStudentCurrentSponsorship } from '@finance/sponsors/server';
import {
	Alert,
	Badge,
	Card,
	Group,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { IconInfoCircle, IconWallet } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

interface SponsorshipInformationProps {
	studentNo: number;
}

export default function SponsorshipInformation({
	studentNo,
}: SponsorshipInformationProps) {
	const { data: sponsorship, isLoading } = useQuery({
		queryKey: ['student-sponsorship', studentNo],
		queryFn: () => getStudentCurrentSponsorship(studentNo),
		staleTime: 1000 * 60 * 15,
		enabled: !!studentNo,
	});

	if (isLoading) {
		return (
			<Card withBorder>
				<Stack gap='md'>
					<Group align='center' gap='sm'>
						<IconWallet size={20} />
						<Text fw={600} size='lg'>
							Sponsorship Information
						</Text>
					</Group>
					<Stack gap='sm'>
						<Skeleton height={24} />
						<Skeleton height={24} />
						<Skeleton height={24} />
					</Stack>
				</Stack>
			</Card>
		);
	}

	if (!sponsorship) {
		return (
			<Card withBorder>
				<Stack gap='md'>
					<Group align='center' gap='sm'>
						<IconWallet size={20} />
						<Text fw={600} size='lg'>
							Sponsorship Information
						</Text>
					</Group>
					<Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
						<Text size='sm'>
							No sponsorship information found. If you believe this is an error,
							please contact the finance office.
						</Text>
					</Alert>
				</Stack>
			</Card>
		);
	}

	const isNMDS = sponsorship.sponsor?.name === 'NMDS';

	return (
		<Card withBorder>
			<Stack gap='md'>
				<Group align='center' gap='sm'>
					<IconWallet size={20} />
					<Text fw={600} size='lg'>
						Sponsorship Information
					</Text>
				</Group>

				<Stack gap='sm'>
					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Sponsor
						</Text>
						<Text fw={500}>{sponsorship.sponsor?.name}</Text>
					</Group>

					{isNMDS && sponsorship.borrowerNo && (
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Borrower Number
							</Text>
							<Text fw={500}>{sponsorship.borrowerNo}</Text>
						</Group>
					)}

					{sponsorship.bankName && (
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Bank
							</Text>
							<Text fw={500}>{sponsorship.bankName}</Text>
						</Group>
					)}

					{sponsorship.accountNumber && (
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Account Number
							</Text>
							<Text fw={500}>{sponsorship.accountNumber}</Text>
						</Group>
					)}

					{isNMDS && (
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Status
							</Text>
							<Badge
								color={sponsorship.confirmed ? 'green' : 'orange'}
								variant='light'
							>
								{sponsorship.confirmed ? 'Confirmed' : 'Pending Confirmation'}
							</Badge>
						</Group>
					)}
				</Stack>

				{isNMDS && !sponsorship.confirmed && (
					<Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
						<Text size='sm'>
							Your NMDS sponsorship is pending confirmation. Please ensure your
							borrower number and bank details are correct.
						</Text>
					</Alert>
				)}
			</Stack>
		</Card>
	);
}
