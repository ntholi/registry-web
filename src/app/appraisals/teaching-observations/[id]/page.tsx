import { Group } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getSession } from '@/core/platform/withPermission';
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

	const canEdit = (isObserver && isDraft) || isAdmin;
	const canDelete = (isObserver && isDraft) || isAdmin;

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Observation'
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
