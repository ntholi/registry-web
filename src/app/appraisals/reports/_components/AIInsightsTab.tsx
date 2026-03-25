'use client';

import { Alert, Button, Grid, GridCol, Stack, Text } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import type { AppraisalInsightsResult, ReportFilter } from '../_lib/types';
import { generateAppraisalInsights } from '../_server/actions';
import InsightCard from './InsightCard';
import InsightChipFilter from './InsightChipFilter';

type Props = {
	filter: ReportFilter;
};

const CATEGORY_MAP: Record<string, string> = {
	strengths: 'strengths',
	concerns: 'concerns',
	training: 'training',
	'action-items': 'action items',
};

export default function AIInsightsTab({ filter }: Props) {
	const [insights, setInsights] = useState<AppraisalInsightsResult | null>(
		null
	);
	const [activeTag, setActiveTag] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleGenerate() {
		setIsGenerating(true);
		setError(null);
		try {
			const result = await generateAppraisalInsights(filter);
			setInsights(result);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to generate insights'
			);
		} finally {
			setIsGenerating(false);
		}
	}

	const filteredCards = insights?.cards.filter((card) => {
		if (!activeTag) return true;
		const catLabel = CATEGORY_MAP[card.category];
		if (catLabel === activeTag) return true;
		return card.tags.some((t) => t.toLowerCase() === activeTag);
	});

	return (
		<Stack gap='lg'>
			<Stack align='center' gap='xs'>
				<Button
					onClick={handleGenerate}
					loading={isGenerating}
					disabled={!filter.termId}
					leftSection={<IconSparkles size={16} />}
				>
					{isGenerating ? 'Generating Insights...' : 'Generate Insights'}
				</Button>
				{!filter.termId && (
					<Text size='xs' c='dimmed'>
						Select a term to generate insights
					</Text>
				)}
			</Stack>

			{error && (
				<Alert
					color='red'
					title='Error'
					withCloseButton
					onClose={() => setError(null)}
				>
					{error}
				</Alert>
			)}

			{insights && (
				<>
					<InsightChipFilter
						tags={insights.tags}
						activeTag={activeTag}
						onChange={setActiveTag}
					/>

					<Text size='xs' c='dimmed' ta='center'>
						{insights.filterSummary} · Generated{' '}
						{new Date(insights.generatedAt).toLocaleString()}
					</Text>

					<Grid gutter='md'>
						{filteredCards?.map((card) => (
							<GridCol
								key={card.category}
								span={
									card.category === 'executive-summary'
										? 12
										: { base: 12, sm: 6, lg: 4 }
								}
							>
								<InsightCard card={card} />
							</GridCol>
						))}
					</Grid>

					{filteredCards?.length === 0 && (
						<Alert color='gray' title='No matching insights'>
							No insights match the selected filter. Try selecting
							&quot;All&quot;.
						</Alert>
					)}
				</>
			)}
		</Stack>
	);
}
