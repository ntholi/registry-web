'use client';

import {
	Badge,
	Group,
	Paper,
	Rating,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';

const LIKERT_LABELS = [
	'Strongly Disagree',
	'Disagree',
	'Neutral',
	'Agree',
	'Strongly Agree',
];

type Props = {
	categoryName: string;
	questionText: string;
	rating: number | null;
	comment: string;
	onRatingChange: (rating: number) => void;
	onCommentChange: (comment: string) => void;
};

export default function QuestionCard({
	categoryName,
	questionText,
	rating,
	comment,
	onRatingChange,
	onCommentChange,
}: Props) {
	return (
		<Paper withBorder p='lg' radius='md'>
			<Stack gap='md'>
				<Badge variant='light' size='sm' w='fit-content'>
					{categoryName}
				</Badge>

				<Text size='lg' fw={500}>
					{questionText}
				</Text>

				<Stack gap={4} align='center'>
					<Rating
						size='xl'
						count={5}
						value={rating ?? 0}
						onChange={onRatingChange}
					/>
					<Group justify='space-between' w='100%' mt={4}>
						<Text size='xs' c='dimmed'>
							{LIKERT_LABELS[0]}
						</Text>
						<Text size='xs' c='dimmed'>
							{LIKERT_LABELS[4]}
						</Text>
					</Group>
				</Stack>

				<Textarea
					placeholder='Add a comment (optional)'
					autosize
					minRows={2}
					maxRows={4}
					value={comment}
					onChange={(e) => onCommentChange(e.currentTarget.value)}
				/>
			</Stack>
		</Paper>
	);
}
