'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { useQueryState } from 'nuqs';
import type { getEmployee } from '../_server/actions';
import EmployeeCardPrinter from './card/EmployeeCardPrinter';
import EmployeeCardView from './card/EmployeeCardView';
import EmployeeView from './info/EmployeeView';

type Props = {
	employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
};

export default function EmployeeTabs({ employee }: Props) {
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'info',
	});

	const renderTabActions = () => {
		if (activeTab === 'card') {
			return (
				<EmployeeCardPrinter
					employee={employee}
					isActive={activeTab === 'card'}
				/>
			);
		}
		return null;
	};

	return (
		<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt='xl'>
			<TabsList>
				<TabsTab value='info'>Details</TabsTab>
				<TabsTab value='card'>Card</TabsTab>
				{renderTabActions()}
			</TabsList>
			<TabsPanel value='info' pt='xl' p='sm'>
				<EmployeeView employee={employee} />
			</TabsPanel>
			<TabsPanel value='card' pt='xl' p='sm'>
				<EmployeeCardView employee={employee} isActive={activeTab === 'card'} />
			</TabsPanel>
		</Tabs>
	);
}
