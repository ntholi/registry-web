'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Card,
	Flex,
	Group,
	Loader,
	Stack,
	Text,
	TextInput,
	Title,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
	deleteQuestion,
	getAllQuestionsWithCategories,
	updateQuestion,
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
	const queryClient = useQueryClient();
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

	const toggleMutation = useMutation({
		mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
			return updateQuestion(id, { active });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedback-questions'] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			return deleteQuestion(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedback-questions'] });
			notifications.show({
				title: 'Question Deleted',
				message: 'The question has been removed',
				color: 'red',
			});
		},
	});

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
				<CategoryGroup
					key={group.categoryName}
					group={group}
					onToggle={(id, active) => toggleMutation.mutate({ id, active })}
					onDelete={(id) => deleteMutation.mutate(id)}
				/>
			))}
		</Stack>
	);
}

type CategoryGroupProps = {
	group: GroupedQuestions;
	onToggle: (id: number, active: boolean) => void;
	onDelete: (id: number) => void;
};

function CategoryGroup({ group, onToggle, onDelete }: CategoryGroupProps) {
	const activeCount = group.questions.filter((q) => q.active).length;

	return (
		<Box>
			<Group gap='xs' mb='xs'>
				<Title order={5} fw={600}>
					{group.categoryName}
				</Title>
				<Badge variant='light' size='sm'>
					{activeCount}/{group.questions.length} active
				</Badge>
			</Group>
			<Stack gap='xs'>
				{group.questions.map((q) => (
					<QuestionCard
						key={q.id}
						question={q}
						onToggle={onToggle}
						onDelete={onDelete}
					/>
				))}
			</Stack>
		</Box>
	);
}

type QuestionCardProps = {
	question: QuestionWithCategory;
	onToggle: (id: number, active: boolean) => void;
	onDelete: (id: number) => void;
};

function QuestionCard({ question, onToggle, onDelete }: QuestionCardProps) {
	return (
		<Card withBorder padding='sm' radius='md'>
			<Group justify='space-between' wrap='nowrap' align='flex-start'>
				<Box style={{ flex: 1 }}>
					<Text size='sm'>{question.text}</Text>
				</Box>
				<Group gap='xs' wrap='nowrap'>
					<Tooltip label={question.active ? 'Active' : 'Inactive'}>
						<Badge
							variant='dot'
							color={question.active ? 'green' : 'gray'}
							style={{ cursor: 'pointer' }}
							onClick={() => onToggle(question.id, !question.active)}
						>
							{question.active ? 'Active' : 'Inactive'}
						</Badge>
					</Tooltip>
					<EditQuestionModal
						question={{
							id: question.id,
							categoryId: question.categoryId,
							text: question.text,
							active: question.active,
						}}
					/>
					<Tooltip label='Delete'>
						<ActionIcon
							variant='subtle'
							color='red'
							size='sm'
							onClick={() => onDelete(question.id)}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>
		</Card>
	);
}
