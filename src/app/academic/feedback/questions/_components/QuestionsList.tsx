'use client';

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	ActionIcon,
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
import { IconGripVertical, IconSearch } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DeleteButton } from '@/shared/ui/adease';
import { deleteCategory } from '../../categories/_server/actions';
import {
	deleteQuestion,
	getQuestionBoard,
	reorderCategories,
	reorderQuestions,
} from '../_server/actions';
import CreateCategoryModal from './CreateCategoryModal';
import CreateQuestionModal from './CreateQuestionModal';
import EditCategoryModal from './EditCategoryModal';
import EditQuestionModal from './EditQuestionModal';

type CategoryBoard = Awaited<ReturnType<typeof getQuestionBoard>>[number];

export default function QuestionsList() {
	const [search, setSearch] = useState('');
	const queryClient = useQueryClient();

	const { data: board = [], isLoading } = useQuery({
		queryKey: ['feedback-question-board'],
		queryFn: () => getQuestionBoard(),
	});

	const reorderCatMutation = useMutation({
		mutationFn: (ids: string[]) => reorderCategories(ids),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ['feedback-question-board'],
			}),
	});

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
	);

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

	const isSearching = search.trim().length > 0;

	function handleCategoryDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = grouped.findIndex((c) => c.id === active.id);
		const newIndex = grouped.findIndex((c) => c.id === over.id);
		const reordered = arrayMove(grouped, oldIndex, newIndex);
		reorderCatMutation.mutate(reordered.map((c) => c.id));
	}

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

			{isSearching ? (
				grouped.map((group) => <CategoryGroup key={group.id} group={group} />)
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleCategoryDragEnd}
				>
					<SortableContext
						items={grouped.map((g) => g.id)}
						strategy={verticalListSortingStrategy}
					>
						{grouped.map((group) => (
							<SortableCategoryGroup key={group.id} group={group} />
						))}
					</SortableContext>
				</DndContext>
			)}
		</Stack>
	);
}

type CategoryGroupProps = {
	group: CategoryBoard;
};

function SortableCategoryGroup({ group }: CategoryGroupProps) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: group.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes}>
			<CategoryGroup group={group} dragListeners={listeners} />
		</div>
	);
}

type CategoryGroupInnerProps = {
	group: CategoryBoard;
	dragListeners?: ReturnType<typeof useSortable>['listeners'];
};

function CategoryGroup({ group, dragListeners }: CategoryGroupInnerProps) {
	const queryClient = useQueryClient();
	const hasQuestions = group.questionCount > 0;

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
	);

	const reorderMutation = useMutation({
		mutationFn: (ids: string[]) => reorderQuestions(ids),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ['feedback-question-board'],
			}),
	});

	function handleQuestionDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = group.questions.findIndex((q) => q.id === active.id);
		const newIndex = group.questions.findIndex((q) => q.id === over.id);
		const reordered = arrayMove(group.questions, oldIndex, newIndex);
		reorderMutation.mutate(reordered.map((q) => q.id));
	}

	return (
		<Paper withBorder radius='md' p='md'>
			<Group justify='space-between' align='center' mb='sm'>
				<Group gap='xs'>
					{dragListeners && (
						<ActionIcon
							variant='subtle'
							color='gray'
							size='sm'
							style={{ cursor: 'grab' }}
							{...dragListeners}
						>
							<IconGripVertical size={16} />
						</ActionIcon>
					)}
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
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleQuestionDragEnd}
					>
						<SortableContext
							items={group.questions.map((q) => q.id)}
							strategy={verticalListSortingStrategy}
						>
							{group.questions.map((q) => (
								<SortableQuestionCard
									key={q.id}
									question={q}
									categoryName={group.name}
								/>
							))}
						</SortableContext>
					</DndContext>
				)}
			</Stack>
		</Paper>
	);
}

type QuestionCardProps = {
	question: CategoryBoard['questions'][number];
	categoryName: string;
};

function SortableQuestionCard({ question, categoryName }: QuestionCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: question.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			withBorder
			padding='sm'
			radius='md'
			{...attributes}
		>
			<Group justify='space-between' wrap='nowrap' align='flex-start'>
				<Group gap='xs' wrap='nowrap' style={{ flex: 1 }}>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='sm'
						style={{ cursor: 'grab' }}
						{...listeners}
					>
						<IconGripVertical size={16} />
					</ActionIcon>
					<Box style={{ flex: 1 }}>
						<Text size='sm'>{question.text}</Text>
					</Box>
				</Group>
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
