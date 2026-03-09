'use client';

import { Badge, Grid, GridCol, Group, Paper, Stack, Text } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { FieldView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import {
	getApprovalRoleLabel,
	getJustificationLabel,
	getTypeLabel,
} from '../_lib/labels';
import type { StudentStatusApprovalRole } from '../_lib/types';
import type { getStudentStatus } from '../_server/actions';
import ApprovalSwitch from './ApprovalSwitch';

type Props = {
	app: NonNullable<Awaited<ReturnType<typeof getStudentStatus>>>;
};

export default function StatusDetails({ app }: Props) {
	const { data: session } = useSession();
	const role = session?.user?.role;
	const isAdminOrRegistry = role === 'admin' || role === 'registry';

	return (
		<Stack p='lg'>
			<Grid>
				<GridCol span={{ base: 12, md: 7 }}>
					<Paper withBorder p='md' pb='xl'>
						<Stack>
							<FieldView label='Student Number' underline={false}>
								<Link href={`/registry/students/${app.stdNo}`}>
									{app.stdNo}
								</Link>
							</FieldView>
							<FieldView label='Student Name' underline={false}>
								{app.student?.name ?? '-'}
							</FieldView>
							<FieldView label='Type' underline={false}>
								<Badge variant='light'>{getTypeLabel(app.type)}</Badge>
							</FieldView>
							<FieldView label='Status' underline={false}>
								<Badge
									color={getStatusColor(app.status as AllStatusType)}
									variant='light'
								>
									{app.status}
								</Badge>
							</FieldView>
							<FieldView label='Justification' underline={false}>
								{getJustificationLabel(app.justification)}
							</FieldView>
							<FieldView label='Term' underline={false}>
								{app.term?.name ?? app.term?.code ?? app.termCode ?? '-'}
							</FieldView>
							<FieldView label='Created By' underline={false}>
								{app.creator?.name ?? '-'}
							</FieldView>
							<FieldView label='Created Date' underline={false}>
								{app.createdAt ? formatDateTime(app.createdAt, 'long') : '-'}
							</FieldView>
						</Stack>
					</Paper>
				</GridCol>
				<GridCol span={{ base: 12, md: 5 }}>
					{isAdminOrRegistry ? (
						<ApprovalSummary approvals={app.approvals ?? []} />
					) : (
						<ApprovalSwitch
							approvals={app.approvals ?? []}
							applicationStatus={app.status}
							applicationId={app.id}
						/>
					)}
				</GridCol>
			</Grid>
			{app.notes && (
				<Paper withBorder p='md'>
					<Text fw={500} mb='xs'>
						Notes
					</Text>
					<Text size='sm'>{app.notes}</Text>
				</Paper>
			)}
		</Stack>
	);
}

type Approval = {
	id: string;
	approverRole: StudentStatusApprovalRole;
	status: string;
	respondedBy: string | null;
	message: string | null;
	respondedAt: Date | null;
	responder: { name: string | null } | null;
};

type ApprovalSummaryProps = {
	approvals: Approval[];
};

function ApprovalSummary({ approvals }: ApprovalSummaryProps) {
	return (
		<Stack gap='sm'>
			{approvals.map((approval) => (
				<Paper key={approval.id} withBorder p='sm'>
					<Group justify='space-between' mb={4}>
						<Text size='sm' fw={500}>
							{getApprovalRoleLabel(approval.approverRole)}
						</Text>
						<Badge
							color={getStatusColor(approval.status as AllStatusType)}
							variant='light'
							size='sm'
						>
							{approval.status}
						</Badge>
					</Group>
					{approval.responder?.name && (
						<Text size='xs' c='dimmed'>
							By {approval.responder.name}
						</Text>
					)}
					{approval.respondedAt && (
						<Text size='xs' c='dimmed'>
							{formatDateTime(approval.respondedAt, 'long')}
						</Text>
					)}
					{approval.message && (
						<Text size='xs' fs='italic' mt={4}>
							{approval.message}
						</Text>
					)}
				</Paper>
			))}
		</Stack>
	);
}
