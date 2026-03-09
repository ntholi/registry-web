'use client';

import {
	Accordion,
	AccordionControl,
	AccordionItem,
	AccordionPanel,
	Badge,
	Grid,
	GridCol,
	Group,
	Paper,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { FieldView } from '@/shared/ui/adease';
import Copyable from '@/shared/ui/Copyable';
import Link from '@/shared/ui/Link';
import { getApprovalRoleLabel, getJustificationLabel } from '../_lib/labels';
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
	const [comment, setComment] = useState<string | undefined>(undefined);
	const [accordion, setAccordion] = useState<string | null>(
		app.reasons ? 'reasons' : 'comments'
	);

	const comments = (app.approvals ?? [])
		.filter((a) => a.comments)
		.map((a) => ({
			role: a.approverRole,
			comments: a.comments as string,
			responder: a.responder?.name,
		}));

	return (
		<Stack p='lg'>
			<Grid>
				<GridCol span={{ base: 12, md: 7 }}>
					<Paper withBorder p='md' pb='xl'>
						<Stack>
							<FieldView label='Student Number' underline={false}>
								<Copyable value={app.stdNo}>
									<Link href={`/registry/students/${app.stdNo}`}>
										{app.stdNo}
									</Link>
								</Copyable>
							</FieldView>
							<FieldView label='Justification' underline={false}>
								{getJustificationLabel(app.justification)}
							</FieldView>

							<FieldView label='Term' underline={false}>
								{app.term?.name ?? app.term?.code ?? app.termCode ?? '-'}
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
							comment={comment}
							setAccordion={setAccordion}
						/>
					)}
				</GridCol>
			</Grid>
			<Accordion value={accordion} onChange={setAccordion} variant='separated'>
				<AccordionItem value='comments'>
					<AccordionControl>Comments</AccordionControl>
					<AccordionPanel>
						<Stack gap='sm'>
							{comments.map((c) => (
								<Paper key={c.role} p='xs'>
									<Group gap='xs'>
										<Text size='sm' fw={500}>
											{getApprovalRoleLabel(c.role)}
										</Text>
										{c.responder && (
											<Text size='xs' c='dimmed'>
												— {c.responder}
											</Text>
										)}
									</Group>
									<Text size='sm'>{c.comments}</Text>
								</Paper>
							))}
							<Textarea
								placeholder='Add a comment...'
								value={comment ?? ''}
								onChange={(e) => setComment(e.currentTarget.value)}
								minRows={3}
							/>
						</Stack>
					</AccordionPanel>
				</AccordionItem>
				<AccordionItem value='reasons'>
					<AccordionControl>Reasons</AccordionControl>
					<AccordionPanel>
						{app.reasons ? (
							<Text size='sm'>{app.reasons}</Text>
						) : (
							<Text size='sm' c='dimmed'>
								No reasons
							</Text>
						)}
					</AccordionPanel>
				</AccordionItem>
			</Accordion>
		</Stack>
	);
}

type Approval = {
	id: string;
	approverRole: StudentStatusApprovalRole;
	status: string;
	respondedBy: string | null;
	comments: string | null;
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
					{approval.comments && (
						<Text size='xs' fs='italic' mt={4}>
							{approval.comments}
						</Text>
					)}
				</Paper>
			))}
		</Stack>
	);
}
