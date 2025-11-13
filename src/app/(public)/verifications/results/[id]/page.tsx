import {
	Alert,
	Badge,
	Card,
	Container,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import {
	IconBook,
	IconCheck,
	IconFileText,
	IconSchool,
	IconUser,
} from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import Logo from '@/shared/components/Logo';
import { formatDateTime } from '@/lib/utils/utils';
import { getStatementOfResultsPrint } from '@/server/registry/statement-of-results-prints/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function StatementOfResultsPage({ params }: Props) {
	const { id } = await params;
	const item = await getStatementOfResultsPrint(id);

	if (!item) {
		return notFound();
	}

	return (
		<div style={{ minHeight: '100vh' }}>
			<Container size='md' p='xl'>
				<Stack align='center' mb='xl'>
					<Logo height={96} />
					<Group gap='xs' align='center'>
						<Title order={1} fw={300} ta='center'>
							Results Verification
						</Title>
					</Group>
				</Stack>

				<Alert
					variant='light'
					color='green'
					title='Authentic document'
					icon={<IconCheck size={20} />}
					mb='xl'
				>
					<Text size='sm' c='dimmed'>
						Please verify that the printed document matches the information
						below
					</Text>
				</Alert>

				<Stack gap='lg'>
					<Card withBorder shadow='sm'>
						<Card.Section withBorder inheritPadding py='md'>
							<Group gap='xs'>
								<IconUser size={16} />
								<Text fw={500}>Student Information</Text>
							</Group>
						</Card.Section>
						<Card.Section inheritPadding py='md'>
							<Stack gap='md'>
								<Group grow>
									<div>
										<Text size='sm' c='dimmed' mb={4}>
											Student Number
										</Text>
										<Text fw={500}>{item.stdNo}</Text>
									</div>
									<div>
										<Text size='sm' c='dimmed' mb={4}>
											Student Name
										</Text>
										<Text fw={500}>{item.studentName}</Text>
									</div>
								</Group>
								<div>
									<Text size='sm' c='dimmed' mb={4}>
										Program of Study
									</Text>
									<Text fw={500}>{item.programName}</Text>
								</div>
							</Stack>
						</Card.Section>
					</Card>

					<Card withBorder shadow='sm'>
						<Card.Section withBorder inheritPadding py='md'>
							<Group gap='xs'>
								<IconBook size={16} />
								<Text fw={500}>Academic Summary</Text>
							</Group>
						</Card.Section>
						<Card.Section inheritPadding py='md'>
							<Stack gap='lg'>
								<Group grow>
									<Paper withBorder p='md' ta='center'>
										<Text size='xl' fw={300}>
											{item.cgpa ? item.cgpa.toFixed(2) : '—'}
										</Text>
										<Text size='sm' c='dimmed'>
											CGPA
										</Text>
									</Paper>
									<Paper withBorder p='md' ta='center'>
										<Text size='xl' fw={300}>
											{item.totalCredits}
										</Text>
										<Text size='sm' c='dimmed'>
											Credits
										</Text>
									</Paper>
									<Paper withBorder p='md' ta='center'>
										<Text size='xl' fw={300}>
											{item.totalModules}
										</Text>
										<Text size='sm' c='dimmed'>
											Modules
										</Text>
									</Paper>
								</Group>

								<Group grow>
									<div>
										<Text size='sm' c='dimmed' mb={4}>
											Classification
										</Text>
										{item.classification ? (
											<Badge variant='light' size='md'>
												{item.classification}
											</Badge>
										) : (
											<Text size='sm' c='dimmed'>
												Not assigned
											</Text>
										)}
									</div>
									<div>
										<Text size='sm' c='dimmed' mb={4}>
											Academic Status
										</Text>
										{item.academicStatus ? (
											<Badge variant='light' size='md'>
												{item.academicStatus}
											</Badge>
										) : (
											<Text size='sm' c='dimmed'>
												Not specified
											</Text>
										)}
									</div>
								</Group>

								{item.graduationDate && (
									<Paper withBorder p='md' bg='var(--mantine-color-gray-0)'>
										<Group gap='xs' mb={4}>
											<IconSchool size={16} />
											<Text size='sm' c='dimmed'>
												Graduation Date
											</Text>
										</Group>
										<Text fw={500}>{item.graduationDate}</Text>
									</Paper>
								)}
							</Stack>
						</Card.Section>
					</Card>

					<Card withBorder shadow='sm'>
						<Card.Section withBorder inheritPadding py='md'>
							<Group gap='xs'>
								<IconFileText size={16} />
								<Text fw={500}>Document Details</Text>
							</Group>
						</Card.Section>
						<Card.Section inheritPadding py='md'>
							<Stack gap='md'>
								<Group grow>
									<div>
										<Text size='sm' c='dimmed' mb={4}>
											Print Date
										</Text>
										<Text fw={500}>{formatDateTime(item.printedAt)}</Text>
									</div>
								</Group>
								<Paper withBorder p='md' bg='var(--mantine-color-gray-0)'>
									<Text size='sm' c='dimmed' mb={4}>
										Verification ID
									</Text>
									<Text
										size='sm'
										ff='monospace'
										c='dimmed'
										style={{ wordBreak: 'break-all' }}
									>
										{item.id}
									</Text>
								</Paper>
							</Stack>
						</Card.Section>
					</Card>
				</Stack>

				<Stack align='center' mt='xl' gap='xs'>
					<Divider w={64} />
					<Text size='sm' c='dimmed' ta='center'>
						This is an official statement of academic results
					</Text>
					<Text size='xs' c='dimmed' ta='center'>
						Generated by Limkokwing University Registry System
					</Text>
				</Stack>
			</Container>
		</div>
	);
}
