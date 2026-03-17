import { Container, Stack, Text, Title } from '@mantine/core';
import CriteriaManager from './_components/CriteriaManager';

export default function ObservationCriteriaPage() {
	return (
		<Container size='lg' py='xl'>
			<Stack gap='xs' mb='xl'>
				<Title order={2}>Observation Criteria</Title>
				<Text c='dimmed' size='sm'>
					Manage categories and criteria used in teaching observation forms.
				</Text>
			</Stack>
			<CriteriaManager />
		</Container>
	);
}
