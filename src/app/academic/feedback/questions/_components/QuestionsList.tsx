'use client';

import {
	Box,
	Card,
	Divider,
	Flex,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DeleteButton } from '@/shared/ui/adease';
import { deleteCategory } from '../../categories/_server/actions';
import { deleteQuestion, getQuestionBoard } from '../_server/actions';
import CreateCategoryModal from './CreateCategoryModal';
import CreateQuestionModal from './CreateQuestionModal';
import EditCategoryModal from './EditCategoryModal';
import EditQuestionModal from './EditQuestionModal';

type CategoryBoard = Awaited<ReturnType<typeof getQuestionBoard>>[number];

export default function QuestionsList() {
	const [search, setSearch] = useState('');

	const { data: board = [], isLoading } = useQuery({
		queryKey: ['feedback-question-board'],
		queryFn: () => getQuestionBoard(),
	});

	const grouped = useMemo(() => {
		const searchValue = search.trim().toLowerCase();
		if (!searchValue) {
			return board;
		}

		return board
			.map((category) => {
				const categoryMatch = category.name.toLowerCase().includes(searchValue);
				if (categoryMatch) {
					return category;
				}

				const filteredQuestions = category.questions.filter((q) =>
					q.text.toLowerCase().includes(searchValue)
				);

				if (filteredQuestions.length === 0) {
					return null;
				}

				return {
					...category,
					questions: filteredQuestions,
					questionCount: filteredQuestions.length,
				};
			})
			.filter((category) => category !== null);
	}, [board, search]);

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
					placeholder='Search categories or questions...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					w={300}
				/>
				<CreateCategoryModal />
			</Group>

			{grouped.length === 0 && (
				<Flex justify='center' align='center' mih={200}>
					<Text c='dimmed' ta='center'>
						{search
							? 'No categories or questions match your search'
							: 'No feedback categories yet. Click "Add Category" to get started.'}
					</Text>
				</Flex>
			)}

			{grouped.map((group) => (
				<CategoryGroup key={group.id} group={group} />
			))}
		</Stack>
	);
}

type CategoryGroupProps = {
	group: CategoryBoard;
};

function CategoryGroup({ group }: CategoryGroupProps) {
	const hasQuestions = group.questionCount > 0;

	return (
		<Paper withBorder radius='md' p='md'>
			<Group justify='space-between' align='center' mb='sm'>
				<Group gap='xs'>
					<Text fw={600}>{group.name}</Text>

					<EditCategoryModal category={{ id: group.id, name: group.name }} />
				</Group>
				<Group gap='xs' wrap='nowrap'>
					<CreateQuestionModal
						categoryId={group.id}
						categoryName={group.name}
					/>

					<Tooltip
						label={
							hasQuestions
								? 'Remove all questions before deleting this category'
								: 'Delete category'
						}
					>
						<span>
							<DeleteButton
								size='sm'
								typedConfirmation={false}
								disabled={hasQuestions}
								handleDelete={async () => {
									await deleteCategory(group.id);
								}}
								queryKey={['feedback-question-board']}
								itemName={group.name}
								itemType='category'
								onSuccess={() => {
									notifications.show({
										title: 'Category Deleted',
										message: 'The category has been removed',
										color: 'red',
									});
								}}
							/>
						</span>
					</Tooltip>
				</Group>
			</Group>
			<Divider mb='sm' />
			<Stack gap='xs'>
				{group.questions.length === 0 ? (
					<Text size='sm' c='dimmed'>
						No questions in this category yet.
					</Text>
				) : (
					group.questions.map((q) => (
						<QuestionCard key={q.id} question={q} categoryName={group.name} />
					))
				)}
			</Stack>
		</Paper>
	);
}

type QuestionCardProps = {
	question: CategoryBoard['questions'][number];
	categoryName: string;
};

function QuestionCard({ question, categoryName }: QuestionCardProps) {
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
							categoryName,
							text: question.text,
						}}
					/>
					<DeleteButton
						size='sm'
						typedConfirmation={false}
						handleDelete={async () => {
							await deleteQuestion(question.id);
						}}
						queryKey={['feedback-question-board']}
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
