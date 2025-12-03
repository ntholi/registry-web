'use client';

import { Tabs } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import RichTextField from '@/shared/ui/adease/RichTextField';
import type { FormValues } from './index';

type ContentTabsProps = {
	form: UseFormReturnType<FormValues>;
};

export default function ContentTabs({ form }: ContentTabsProps) {
	return (
		<Tabs defaultValue='description'>
			<Tabs.List>
				<Tabs.Tab value='description'>Description</Tabs.Tab>
				<Tabs.Tab value='instructions'>Instructions</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value='description' pt='md'>
				<RichTextField
					showFullScreenButton={false}
					height={280}
					{...form.getInputProps('description')}
				/>
			</Tabs.Panel>

			<Tabs.Panel value='instructions' pt='md'>
				<RichTextField
					showFullScreenButton={false}
					height={280}
					{...form.getInputProps('instructions')}
				/>
			</Tabs.Panel>
		</Tabs>
	);
}
