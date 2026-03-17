import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import ObservationForm from '../../_components/ObservationForm';
import {
	getActiveCycles,
	getAllCriteria,
	getObservation,
	updateObservation,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: Props) {
	const { id } = await params;
	const [obs, criteria, activeCycles] = await Promise.all([
		getObservation(id),
		getAllCriteria(),
		getActiveCycles(),
	]);

	if (!obs) return notFound();

	const obsData = obs as {
		ratings?: Array<{ criterionId: string; rating: number | null }>;
		assignedModule?: { user?: { id: string } | null } | null;
		cycleId: string;
		assignedModuleId: number;
		strengths: string | null;
		improvements: string | null;
		recommendations: string | null;
		trainingArea: string | null;
	};

	const ratings = Array.isArray(obsData.ratings)
		? obsData.ratings.map((r) => ({
				criterionId: r.criterionId,
				rating: r.rating,
			}))
		: criteria.map((c) => ({ criterionId: c.id, rating: null }));

	const lecturerUserId = obsData.assignedModule?.user?.id;

	return (
		<Box p='lg'>
			<ObservationForm
				title='Edit Observation'
				criteria={criteria}
				activeCycles={activeCycles}
				defaultValues={{
					id,
					cycleId: obsData.cycleId,
					assignedModuleId: obsData.assignedModuleId,
					strengths: obsData.strengths,
					improvements: obsData.improvements,
					recommendations: obsData.recommendations,
					trainingArea: obsData.trainingArea,
					ratings,
					lecturerUserId,
				}}
				onSubmit={async (values) => {
					'use server';
					return updateObservation(id, values);
				}}
			/>
		</Box>
	);
}
