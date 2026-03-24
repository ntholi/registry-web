'use client';

import { Stack, Tabs, TabsPanel, TabsTab } from '@mantine/core';
import { useState } from 'react';
import ScrollableTabsList from '@/shared/ui/ScrollableTabsList';
import LetterPreview from './LetterPreview';
import LetterPrintHistoryView from './LetterPrintHistoryView';

type LetterRecipient = {
	title: string;
	org: string;
	address: string | null;
	city: string | null;
};

type LetterData = {
	id: string;
	content: string;
	recipient: LetterRecipient | null;
	salutation: string | null;
	subject: string | null;
	template: {
		signOffName: string | null;
		signOffTitle: string | null;
	} | null;
};

type Props = {
	letter: LetterData;
};

export default function LetterTabs({ letter }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('preview');

	return (
		<Stack mt='md'>
			<Tabs value={activeTab} onChange={setActiveTab} variant='default'>
				<ScrollableTabsList>
					<TabsTab value='preview'>Preview</TabsTab>
					<TabsTab value='history'>History</TabsTab>
				</ScrollableTabsList>

				<TabsPanel value='preview' pt='xl'>
					<LetterPreview
						content={letter.content}
						recipient={letter.recipient}
						salutation={letter.salutation}
						subject={letter.subject}
						signOffName={letter.template?.signOffName}
						signOffTitle={letter.template?.signOffTitle}
					/>
				</TabsPanel>

				<TabsPanel value='history' pt='xl'>
					<LetterPrintHistoryView
						letterId={letter.id}
						isActive={activeTab === 'history'}
					/>
				</TabsPanel>
			</Tabs>
		</Stack>
	);
}
