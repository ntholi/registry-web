'use client';

import { getStudentSponsors } from '@finance/sponsors';
import {
	Alert,
	Badge,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { EditSponsoredStudentModal } from './sponsor-modals/EditSponsorModal';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

const ALLOWED_ROLES = ['registry', 'admin', 'finance'];

export default function StudentSponsorsView({ stdNo, isActive = true }: Props) {
	const { data: session } = useSession();
	const canEdit = ALLOWED_ROLES.includes(session?.user?.role || '');

	const { data, isLoading, error } = useQuery({
		queryKey: ['student-sponsors', stdNo],
		queryFn: () => getStudentSponsors(stdNo),
		enabled: isActive,
	});

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (error) {
		return (
			<Alert color='red' title='Error'>
				Failed to load sponsored students records. Please try again.
			</Alert>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Stack align='center' py='xl' gap='md'>
				<Text size='lg' fw={500} c='dimmed'>
					No sponsored students records found
				</Text>
				<Text size='sm' c='dimmed' ta='center'>
					This student has no sponsorship records yet.
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap='md'>
			{data.map((sponsoredStudent) => (
				<SponsorCard
					key={sponsoredStudent.id}
					sponsoredStudent={sponsoredStudent}
					canEdit={canEdit}
				/>
			))}
		</Stack>
	);
}

export type SponsoredStudentType = Awaited<
	ReturnType<typeof getStudentSponsors>
>[number];

type SponsorCardProps = {
	sponsoredStudent: SponsoredStudentType;
	canEdit: boolean;
};

function SponsorCard({ sponsoredStudent, canEdit }: SponsorCardProps) {
	const termCodes = sponsoredStudent.sponsoredTerms
		.map((st) => st.term?.code)
		.filter(Boolean)
		.sort()
		.reverse();

	return (
		<Paper withBorder p='md'>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4}>
						<Group gap='xs'>
							<Text fw={500} size='sm'>
								{sponsoredStudent.sponsor?.name || 'Unknown Sponsor'}
							</Text>
						</Group>
						{sponsoredStudent.borrowerNo && (
							<Text size='xs' c='dimmed'>
								Borrower No: {sponsoredStudent.borrowerNo}
							</Text>
						)}
					</Stack>
					{canEdit && (
						<EditSponsoredStudentModal sponsoredStudent={sponsoredStudent} />
					)}
				</Group>

				{(sponsoredStudent.bankName || sponsoredStudent.accountNumber) && (
					<Group gap='md'>
						{sponsoredStudent.bankName && (
							<Stack gap={2}>
								<Text size='xs' c='dimmed'>
									Bank
								</Text>
								<Text size='xs'>{sponsoredStudent.bankName}</Text>
							</Stack>
						)}
						{sponsoredStudent.accountNumber && (
							<Stack gap={2}>
								<Text size='xs' c='dimmed'>
									Account Number
								</Text>
								<Text size='xs'>{sponsoredStudent.accountNumber}</Text>
							</Stack>
						)}
					</Group>
				)}

				{termCodes.length > 0 && (
					<Stack gap={4}>
						<Text size='xs' c='dimmed'>
							Terms
						</Text>
						<Group gap='xs'>
							{termCodes.map((code) => (
								<Badge key={code} size='xs' variant='light'>
									{code}
								</Badge>
							))}
						</Group>
					</Stack>
				)}
			</Stack>
		</Paper>
	);
}

function LoadingSkeleton() {
	return (
		<Stack gap='md'>
			{[1, 2].map((i) => (
				<Paper key={i} withBorder p='md'>
					<Stack gap='sm'>
						<Group justify='space-between' align='flex-start'>
							<Stack gap={4}>
								<Group gap='xs'>
									<Skeleton height={16} width={120} />
									<Skeleton height={18} width={80} />
								</Group>
								<Skeleton height={12} width={150} />
							</Stack>
						</Group>
						<Group gap='md'>
							<Stack gap={2}>
								<Skeleton height={12} width={40} />
								<Skeleton height={12} width={80} />
							</Stack>
							<Stack gap={2}>
								<Skeleton height={12} width={80} />
								<Skeleton height={12} width={100} />
							</Stack>
						</Group>
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}
