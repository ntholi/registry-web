import { resolveApplicationFee } from '@admissions/_lib/fees';
import RecordAuditHistory from '@audit-logs/_components/RecordAuditHistory';
import {
	Badge,
	Card,
	Group,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import {
	IconCash,
	IconClipboardList,
	IconHistory,
	IconInfoCircle,
	IconNote,
	IconSchool,
	IconStars,
} from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { formatDateTime, isIntakePeriodActive } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import NotesSection from '../_components/NotesSection';
import PaymentSection from '../_components/PaymentSection';
import ScoresSection from '../_components/ScoresSection';
import StatusBadge from '../_components/StatusBadge';
import StatusChangeModal from '../_components/StatusChangeModal';
import StatusHistory from '../_components/StatusHistory';
import type { ApplicationStatus, PaymentStatus } from '../_lib/types';
import { deleteApplication, getApplication } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ApplicationDetails({ params }: Props) {
	const { id } = await params;
	const item = await getApplication(id);

	if (!item) {
		return notFound();
	}

	const isActive = isIntakePeriodActive(
		item.intakePeriod.startDate,
		item.intakePeriod.endDate
	);

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Application'
				queryKey={['applications']}
				handleDelete={async () => {
					'use server';
					await deleteApplication(id);
				}}
				deleteRoles={['admin']}
				itemName={`${item.applicant.fullName} - ${item.intakePeriod.name}`}
				itemType='Application'
			/>
			<DetailsViewBody>
				<Tabs defaultValue='details'>
					<TabsList>
						<TabsTab value='details' leftSection={<IconInfoCircle size={16} />}>
							Details
						</TabsTab>
						<TabsTab value='programs' leftSection={<IconSchool size={16} />}>
							Programs
						</TabsTab>
						<TabsTab value='scores' leftSection={<IconStars size={16} />}>
							Scores
						</TabsTab>
						<TabsTab value='payment' leftSection={<IconCash size={16} />}>
							Payment
						</TabsTab>
						<TabsTab value='history' leftSection={<IconHistory size={16} />}>
							History
						</TabsTab>
						<TabsTab value='notes' leftSection={<IconNote size={16} />}>
							Notes
						</TabsTab>
						<TabsTab
							value='audit'
							leftSection={<IconClipboardList size={16} />}
						>
							Audit
						</TabsTab>
					</TabsList>

					<TabsPanel value='details' pt='md'>
						<Stack gap='md'>
							<Card withBorder>
								<Stack gap='sm'>
									<Group justify='space-between'>
										<Text fw={500}>Current Status</Text>
										<StatusBadge status={item.status as ApplicationStatus} />
									</Group>
									<StatusChangeModal
										applicationId={item.id}
										currentStatus={item.status as ApplicationStatus}
									/>
								</Stack>
							</Card>

							<FieldView label='Applicant'>
								<Link href={`/admissions/applicants/${item.applicant.id}`}>
									{item.applicant.fullName}
								</Link>
								{item.applicant.nationalId && (
									<Text size='xs' c='dimmed'>
										ID: {item.applicant.nationalId}
									</Text>
								)}
							</FieldView>

							<FieldView label='Intake Period'>
								<Group gap='xs'>
									{item.intakePeriod.name}
									{isActive && (
										<Badge size='xs' color='green'>
											Active
										</Badge>
									)}
								</Group>
								<Text size='xs' c='dimmed'>
									{item.intakePeriod.startDate} to {item.intakePeriod.endDate}
								</Text>
							</FieldView>

							<FieldView label='Application Date'>
								{item.applicationDate
									? formatDateTime(item.applicationDate)
									: 'N/A'}
							</FieldView>

							<FieldView label='Created By'>
								{item.createdByUser?.name || 'System'}
							</FieldView>
						</Stack>
					</TabsPanel>

					<TabsPanel value='programs' pt='md'>
						<Stack gap='md'>
							<Card withBorder>
								<Stack gap='xs'>
									<Text size='sm' fw={500} c='dimmed'>
										First Choice
									</Text>
									<Text fw={500}>
										{item.firstChoiceProgram
											? `${item.firstChoiceProgram.code} - ${item.firstChoiceProgram.name}`
											: 'Program not selected yet'}
									</Text>
								</Stack>
							</Card>

							{item.secondChoiceProgram && (
								<Card withBorder>
									<Stack gap='xs'>
										<Text size='sm' fw={500} c='dimmed'>
											Second Choice
										</Text>
										<Text fw={500}>
											{item.secondChoiceProgram.code} -{' '}
											{item.secondChoiceProgram.name}
										</Text>
									</Stack>
								</Card>
							)}

							{!item.secondChoiceProgram && (
								<Text size='sm' c='dimmed'>
									No second choice program selected
								</Text>
							)}
						</Stack>
					</TabsPanel>

					<TabsPanel value='scores' pt='md'>
						<ScoresSection
							applicationId={item.id}
							scores={item.scores}
							firstChoiceProgram={item.firstChoiceProgram}
							secondChoiceProgram={item.secondChoiceProgram}
						/>
					</TabsPanel>

					<TabsPanel value='payment' pt='md'>
						<PaymentSection
							feeAmount={resolveApplicationFee(
								item.intakePeriod,
								item.applicant.nationality
							)}
							paymentStatus={item.paymentStatus as PaymentStatus}
							bankDeposits={item.bankDeposits}
						/>
					</TabsPanel>

					<TabsPanel value='history' pt='md'>
						<StatusHistory history={item.statusHistory} />
					</TabsPanel>

					<TabsPanel value='notes' pt='md'>
						<NotesSection applicationId={item.id} notes={item.notes} />
					</TabsPanel>

					<TabsPanel value='audit' pt='md'>
						<RecordAuditHistory tableName='applications' recordId={item.id} />
					</TabsPanel>
				</Tabs>
			</DetailsViewBody>
		</DetailsView>
	);
}
