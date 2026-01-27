'use client';

import { getStudentCurrentSponsorship } from '@finance/sponsors';
import { Alert, Card, Group, Skeleton, Stack, Text } from '@mantine/core';
import { IconInfoCircle, IconWallet } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getAlertColor } from '@/shared/lib/utils/colors';

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
					<Alert
						icon={<IconInfoCircle size='1rem' />}
						color={getAlertColor('info')}
					>
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
				</Stack>
			</Stack>
		</Card>
	);
}
