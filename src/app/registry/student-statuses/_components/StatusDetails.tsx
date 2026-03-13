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
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
	Textarea,
	Title,
} from '@mantine/core';
import { useState } from 'react';
import { authClient } from '@/core/auth-client';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { FieldView } from '@/shared/ui/adease';
import Copyable from '@/shared/ui/Copyable';
import Link from '@/shared/ui/Link';
import { getApprovalRoleLabel, getJustificationLabel } from '../_lib/labels';
import type { getStudentStatus } from '../_server/actions';
import ApprovalSwitch from './ApprovalSwitch';

type Props = {
	app: NonNullable<Awaited<ReturnType<typeof getStudentStatus>>>;
};

export default function StatusDetails({ app }: Props) {
	const { data: session } = authClient.useSession();
	const role = session?.user?.role;
	const isAdminOrRegistry = role === 'admin' || role === 'registry';

	if (isAdminOrRegistry) {
		return <AdminRegistryView app={app} />;
	}

	return <OtherRolesView app={app} />;
}

function AdminRegistryView({ app }: Props) {
	const approvals = app.approvals ?? [];

	return (
		<Stack p='lg' gap='lg'>
			<Paper withBorder p='lg'>
				<Title order={6} c='dimmed' tt='uppercase' fz='xs' mb='md'>
					Application Details
				</Title>
				<Grid gutter='md'>
					<GridCol span={{ base: 12, sm: 6 }}>
						<FieldView label='Student Number' underline={false}>
							<Copyable value={app.stdNo}>
								<Link href={`/registry/students/${app.stdNo}`}>
									{app.stdNo}
								</Link>
							</Copyable>
						</FieldView>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6 }}>
						<FieldView label='Justification' underline={false}>
							{getJustificationLabel(app.justification)}
						</FieldView>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6 }}>
						<FieldView label='Term' underline={false}>
							{app.term?.name ?? app.term?.code ?? app.termCode ?? '-'}
						</FieldView>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6 }}>
						<FieldView label='Semester' underline={false}>
							{app.semester?.termCode ?? '-'}
						</FieldView>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6 }}>
						<FieldView label='Created By' underline={false}>
							{app.creator?.name ?? '-'}
						</FieldView>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6 }}>
						<FieldView label='Created Date' underline={false}>
							{app.createdAt ? formatDateTime(app.createdAt, 'long') : '-'}
						</FieldView>
					</GridCol>
				</Grid>
			</Paper>

			<Paper withBorder p='lg'>
				<Title order={6} c='dimmed' tt='uppercase' fz='xs' mb='md'>
					Reasons
				</Title>
				{app.reasons ? (
					<Text size='sm'>{app.reasons}</Text>
				) : (
					<Text size='sm' c='dimmed' fs='italic'>
						No reasons provided
					</Text>
				)}
			</Paper>

			<Paper withBorder p='lg'>
				<Title order={6} c='dimmed' tt='uppercase' fz='xs' mb='md'>
					Approvers
				</Title>
				{approvals.length === 0 ? (
					<Text size='sm' c='dimmed' fs='italic'>
						No approvals recorded
					</Text>
				) : (
					<Table highlightOnHover withColumnBorders>
						<TableThead>
							<TableTr>
								<TableTh>Role</TableTh>
								<TableTh>Status</TableTh>
								<TableTh>Responded By</TableTh>
								<TableTh>Comments</TableTh>
								<TableTh>Date</TableTh>
							</TableTr>
						</TableThead>
						<TableTbody>
							{approvals.map((approval) => (
								<TableTr key={approval.id}>
									<TableTd>
										<Text size='sm' fw={500}>
											{getApprovalRoleLabel(approval.approverRole)}
										</Text>
									</TableTd>
									<TableTd>
										<Badge
											color={getStatusColor(approval.status as AllStatusType)}
											variant='light'
											size='sm'
											tt='capitalize'
										>
											{approval.status}
										</Badge>
									</TableTd>
									<TableTd>
										<Text size='sm'>
											{approval.responder?.name ?? (
												<Text span size='sm' c='dimmed' fs='italic'>
													Pending
												</Text>
											)}
										</Text>
									</TableTd>
									<TableTd>
										{approval.comments ? (
											<Text size='sm' fs='italic'>
												{approval.comments}
											</Text>
										) : (
											<Text size='sm' c='dimmed'>
												—
											</Text>
										)}
									</TableTd>
									<TableTd>
										{approval.respondedAt ? (
											<Text size='sm' c='dimmed'>
												{formatDateTime(approval.respondedAt, 'long')}
											</Text>
										) : (
											<Text size='sm' c='dimmed'>
												—
											</Text>
										)}
									</TableTd>
								</TableTr>
							))}
						</TableTbody>
					</Table>
				)}
			</Paper>
		</Stack>
	);
}

type OtherRolesProps = Props & { role?: string };

function OtherRolesView({ app }: OtherRolesProps) {
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
					<ApprovalSwitch
						approvals={app.approvals ?? []}
						applicationStatus={app.status}
						applicationId={app.id}
						comment={comment}
						setAccordion={setAccordion}
					/>
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
								rows={5}
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
