import { Box } from '@mantine/core';
import ObservationForm from '../_components/ObservationForm';
import {
	createObservation,
	getActiveCycles,
	getAllCriteria,
} from '../_server/actions';

export default async function NewPage() {
	const [criteria, activeCycles] = await Promise.all([
		getAllCriteria(),
		getActiveCycles(),
	]);

	return (
		<Box p='lg'>
			<ObservationForm
				title='New Observation'
				criteria={criteria}
				activeCycles={activeCycles}
				onSubmit={async (values) => {
					'use server';
					return createObservation(values);
				}}
			/>
		</Box>
	);
}
