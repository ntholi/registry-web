'use client';

import {
	Badge,
	Box,
	Card,
	Divider,
	Group,
	LoadingOverlay,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import type { PaymentType, students } from '@registry/_database';
import {
	IconGenderFemale,
	IconGenderMale,
	IconId,
	IconReceipt,
	IconSchool,
	IconUser,
} from '@tabler/icons-react';

type Student = typeof students.$inferSelect & {
	user?: { name?: string | null } | null;
};

type PaymentReceiptData = {
	paymentType: PaymentType;
	receiptNo: string;
};

type SelectedProgram = {
	id: number;
	stdNo: number;
	createdAt: Date | null;
	intakeDate: string | null;
	regDate: string | null;
	startTerm: string | null;
	structureId: number;
	stream: string | null;
	graduationDate: string | null;
	status: 'Active' | 'Changed' | 'Completed' | 'Deleted' | 'Inactive';
	assistProvider: string | null;
	structure: {
		id: number;
		createdAt: Date | null;
		code: string;
		desc: string | null;
		programId: number;
		program: {
			id: number;
			name: string;
			createdAt: Date | null;
			code: string;
			level: 'certificate' | 'diploma' | 'degree';
			schoolId: number;
			school: {
				id: number;
				name: string;
				code: string;
				createdAt: Date | null;
			};
		};
	};
	semesters: Array<Record<string, unknown>>;
};

interface ReviewAndSubmitProps {
	student: Student;
	selectedProgram?: SelectedProgram;
	paymentReceipts: PaymentReceiptData[];
	loading?: boolean;
}

export default function ReviewAndSubmit({
	student,
	selectedProgram,
	paymentReceipts,
	loading = false,
}: ReviewAndSubmitProps) {
	const formatPaymentType = (type: string) => {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	return (
		<Box pos='relative'>
			<LoadingOverlay visible={loading} />

			<Stack gap='lg'>
				<Card withBorder shadow='sm' radius='md' padding='lg'>
					<Group mb='md'>
						<Title order={3}>Your Information</Title>
					</Group>

					<Stack gap='sm'>
						<Group>
							<IconSchool size='1rem' color='gray' />
							<Text size='sm' c='dimmed' w={120}>
								Program:
							</Text>
							<Text fw={500}>
								{selectedProgram?.structure.program.name} (
								{selectedProgram?.structure.program.code})
							</Text>
						</Group>

						<Group>
							<IconUser size='1rem' color='gray' />
							<Text size='sm' c='dimmed' w={120}>
								Name:
							</Text>
							<Text fw={500}>{student.name}</Text>
						</Group>

						<Group>
							<IconId size='1rem' color='gray' />
							<Text size='sm' c='dimmed' w={120}>
								National ID:
							</Text>
							<Text fw={500}>{student.nationalId || 'Not provided'}</Text>
						</Group>

						<Group>
							{student.gender === 'Male' ? (
								<IconGenderMale size='1rem' color='gray' />
							) : (
								<IconGenderFemale size='1rem' color='gray' />
							)}
							<Text size='sm' c='dimmed' w={120}>
								Gender:
							</Text>
							<Text fw={500}>{student.gender || 'Not specified'}</Text>
						</Group>

						<Group>
							<IconId size='1rem' color='gray' />
							<Text size='sm' c='dimmed' w={120}>
								Student No:
							</Text>
							<Text fw={500}>{student.stdNo}</Text>
						</Group>
					</Stack>
				</Card>

				<Card withBorder shadow='sm' radius='md' padding='lg'>
					<Group mb='md'>
						<IconReceipt size='1.2rem' />
						<Title order={3}>Payment Receipts</Title>
						<Badge color='blue' variant='light'>
							{paymentReceipts.length} Receipt
							{paymentReceipts.length !== 1 ? 's' : ''}
						</Badge>
					</Group>

					<Stack gap='md'>
						{paymentReceipts.map((receipt) => (
							<Paper
								key={`${receipt.paymentType}-${receipt.receiptNo}`}
								p='sm'
								withBorder
							>
								<Group justify='space-between' align='center'>
									<Box>
										<Text fw={500} size='sm'>
											{formatPaymentType(receipt.paymentType)}
										</Text>
										<Text size='xs' c='dimmed'>
											Receipt Number
										</Text>
									</Box>

									<Badge variant='outline' size='lg'>
										{receipt.receiptNo}
									</Badge>
								</Group>
							</Paper>
						))}
					</Stack>
				</Card>

				<Divider />

				<Text size='sm' c='dimmed' ta='center'>
					By submitting this request, you confirm that all information provided
					is accurate and complete.
				</Text>
			</Stack>
		</Box>
	);
}
