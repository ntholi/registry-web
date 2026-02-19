import { Container, Stack, Text, Title } from '@mantine/core';
import QuestionsList from './_components/QuestionsList';

export default function QuestionsPage() {
	return (
		<Container size='lg' py='xl'>
			<Stack gap='xs' mb='xl'>
				<Title order={2}>Feedback Questions</Title>
				<Text c='dimmed' size='sm'>
					Manage questions used in student feedback surveys, organized by
					category.
				</Text>
			</Stack>
			<QuestionsList />
		</Container>
	);
}
