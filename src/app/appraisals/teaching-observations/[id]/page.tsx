import { Badge, Card, Group, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getSession } from '@/core/platform/withPermission';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import AcknowledgeButton from '../_components/AcknowledgeButton';
import ObservationDetail from '../_components/ObservationDetail';
import SubmitButton from '../_components/SubmitButton';
import { deleteObservation, getObservation } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ObservationDetailPage({ params }: Props) {
	const { id } = await params;
	const [obs, session] = await Promise.all([getObservation(id), getSession()]);

	if (!obs) return notFound();

	const userId = session?.user?.id;
	const isObserver = obs.observerId === userId;
	const assignedModule = obs.assignedModule as
		| { user?: { id: string } | null }
		| null
		| undefined;
	const isLecturer = assignedModule?.user?.id === userId;
	const isDraft = obs.status === 'draft';
	const isSubmitted = obs.status === 'submitted';
	const isAdmin = session?.user?.role === 'admin';
	const status = obs.status as AllStatusType;
	const allRatings = obs.ratings
		.filter((r) => r.rating != null)
		.map((r) => r.rating!);
	const overallAvg =
		allRatings.length > 0
			? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
			: null;
	const headerTitle = (
		<Group gap='lg' wrap='wrap' align='center'>
			<Title order={3} fw={100}>
				Observation
			</Title>
			<Card p={'xs'}>
				<Group>
					<Badge size='sm' variant='light' color={getStatusColor(status)}>
						{obs.status}
					</Badge>
					{overallAvg != null && (
						<Badge size='sm' variant='light'>
							{overallAvg.toFixed(2)} / 5
						</Badge>
					)}
				</Group>
			</Card>
		</Group>
	);

	const canEdit = (isObserver && isDraft) || isAdmin;
	const canDelete = (isObserver && isDraft) || isAdmin;

	return (
		<DetailsView>
			<DetailsViewHeader
				title={headerTitle}
				queryKey={['teaching-observations']}
				handleDelete={
					canDelete
						? async () => {
								'use server';
								return deleteObservation(id);
							}
						: undefined
				}
				hideEdit={!canEdit}
				editPermission={
					canEdit ? { 'teaching-observations': ['update'] } : undefined
				}
				deletePermission={
					canDelete ? { 'teaching-observations': ['delete'] } : undefined
				}
			/>
			<ObservationDetail observation={obs as never} />
			<Group mt='md'>
				{isObserver && isDraft && <SubmitButton observationId={id} />}
				{isLecturer && isSubmitted && <AcknowledgeButton observationId={id} />}
			</Group>
		</DetailsView>
	);
}
