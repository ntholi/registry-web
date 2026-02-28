'use client';

import {
	Badge,
	Center,
	Divider,
	Loader,
	SimpleGrid,
	Stack,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import ApprovalPanel from '../_components/ApprovalPanel';
import StatusTimeline from '../_components/StatusTimeline';
import { getJustificationLabel, getTypeLabel } from '../_lib/labels';
import { cancelStudentStatus, getStudentStatus } from '../_server/actions';

export default function StudentStatusDetails() {
	const params = useParams();
	const id = Number(params.id);

	const {
		data: app,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['student-status', id],
		queryFn: () => getStudentStatus(id),
		enabled: !!id,
	});

	if (isLoading) {
		return (
			<Center h='60vh'>
				<Loader />
			</Center>
		);
	}

	if (error || !app) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={app.student?.name ?? String(app.stdNo)}
				queryKey={['student-statuses']}
				handleDelete={
					app.status === 'pending'
						? async () => {
								await cancelStudentStatus(id);
							}
						: undefined
				}
				deleteRoles={['registry', 'admin']}
			/>
			<DetailsViewBody>
				<Stack gap='lg'>
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						<FieldView label='Student Number'>
							<Link href={`/registry/students/${app.stdNo}`}>{app.stdNo}</Link>
						</FieldView>
						<FieldView label='Student Name'>
							{app.student?.name ?? '-'}
						</FieldView>
						<FieldView label='Type'>
							<Badge variant='light'>{getTypeLabel(app.type)}</Badge>
						</FieldView>
						<FieldView label='Status'>
							<Badge
								color={getStatusColor(app.status as AllStatusType)}
								variant='light'
							>
								{app.status}
							</Badge>
						</FieldView>
						<FieldView label='Justification'>
							{getJustificationLabel(app.justification)}
						</FieldView>
						<FieldView label='Term Code'>{app.termCode}</FieldView>
						<FieldView label='Created By'>{app.creator?.name ?? '-'}</FieldView>
						<FieldView label='Created Date'>
							{app.createdAt ? formatDateTime(app.createdAt, 'long') : '-'}
						</FieldView>
					</SimpleGrid>

					{app.notes && <FieldView label='Notes'>{app.notes}</FieldView>}

					<Divider />
					<Title order={4}>Approvals</Title>
					<ApprovalPanel
						approvals={app.approvals ?? []}
						applicationStatus={app.status}
						applicationId={app.id}
					/>

					<Divider />
					<Title order={4}>Timeline</Title>
					<StatusTimeline
						createdAt={app.createdAt}
						creatorName={app.creator?.name ?? null}
						approvals={app.approvals ?? []}
						status={app.status}
						updatedAt={app.updatedAt}
					/>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
