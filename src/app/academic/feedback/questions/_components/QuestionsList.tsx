'use client';

import {
	Box,
	Card,
	Flex,
	Group,
	Loader,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DeleteButton } from '@/shared/ui/adease';
import {
	deleteQuestion,
	getAllQuestionsWithCategories,
} from '../_server/actions';
import CreateQuestionModal from './CreateQuestionModal';
import EditQuestionModal from './EditQuestionModal';

type QuestionWithCategory = Awaited<
	ReturnType<typeof getAllQuestionsWithCategories>
>[number];

type GroupedQuestions = {
	categoryName: string;
	questions: QuestionWithCategory[];
};

export default function QuestionsList() {
	const [search, setSearch] = useState('');

	const { data: questions = [], isLoading } = useQuery({
		queryKey: ['feedback-questions'],
		queryFn: () => getAllQuestionsWithCategories(),
	});

	const grouped = useMemo(() => {
		const filtered = questions.filter(
			(q) =>
				q.text.toLowerCase().includes(search.toLowerCase()) ||
				q.category?.name.toLowerCase().includes(search.toLowerCase())
		);

		const map = new Map<string, QuestionWithCategory[]>();
		for (const q of filtered) {
			const cat = q.category?.name ?? 'Uncategorized';
			if (!map.has(cat)) map.set(cat, []);
			map.get(cat)!.push(q);
		}

		return Array.from(map.entries())
			.map(([categoryName, qs]) => ({
				categoryName,
				questions: qs,
			}))
			.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
	}, [questions, search]);

	if (isLoading) {
		return (
			<Flex justify='center' align='center' mih={300}>
				<Loader />
			</Flex>
		);
	}

	return (
		<Stack gap='lg'>
			<Group justify='space-between'>
				<TextInput
					placeholder='Search questions...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					w={300}
				/>
				<CreateQuestionModal />
			</Group>

			{grouped.length === 0 && (
				<Flex justify='center' align='center' mih={200}>
					<Text c='dimmed' ta='center'>
						{search
							? 'No questions match your search'
							: 'No feedback questions yet. Click "Add Question" to get started.'}
					</Text>
				</Flex>
			)}

			{grouped.map((group) => (
				<CategoryGroup key={group.categoryName} group={group} />
			))}
		</Stack>
	);
}

type CategoryGroupProps = {
	group: GroupedQuestions;
};

function CategoryGroup({ group }: CategoryGroupProps) {
	return (
		<Box>
			<Group gap='xs' mb='xs'>
				<Title order={5} fw={600}>
					{group.categoryName}
				</Title>
			</Group>
			<Stack gap='xs'>
				{group.questions.map((q) => (
					<QuestionCard key={q.id} question={q} />
				))}
			</Stack>
		</Box>
	);
}

type QuestionCardProps = {
	question: QuestionWithCategory;
};

function QuestionCard({ question }: QuestionCardProps) {
	return (
		<Card withBorder padding='sm' radius='md'>
			<Group justify='space-between' wrap='nowrap' align='flex-start'>
				<Box style={{ flex: 1 }}>
					<Text size='sm'>{question.text}</Text>
				</Box>
				<Group gap='xs' wrap='nowrap'>
					<EditQuestionModal
						question={{
							id: question.id,
							categoryId: question.categoryId,
							text: question.text,
						}}
					/>
					<DeleteButton
						size='sm'
						handleDelete={async () => {
							await deleteQuestion(question.id);
						}}
						queryKey={['feedback-questions']}
						itemName={question.text}
						itemType='question'
						onSuccess={() => {
							notifications.show({
								title: 'Question Deleted',
								message: 'The question has been removed',
								color: 'red',
							});
						}}
					/>
				</Group>
			</Group>
		</Card>
	);
}
