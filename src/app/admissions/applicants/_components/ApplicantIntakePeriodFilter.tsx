'use client';

import { findActiveIntakePeriods } from '@admissions/intake-periods/_server/actions';
import { useQuery } from '@tanstack/react-query';
import { FilterMenu } from '@/shared/ui/adease';

export default function ApplicantIntakePeriodFilter() {
	const { data: periods = [] } = useQuery({
		queryKey: ['active-intake-periods'],
		queryFn: findActiveIntakePeriods,
	});

	const options = [
		{ value: 'all', label: 'All Periods' },
		...periods.map((p) => ({
			value: p.id.toString(),
			label: p.name,
		})),
	];

	return (
		<FilterMenu
			label='Intake Period'
			queryParam='intakePeriodId'
			defaultValue='all'
			options={options}
		/>
	);
}
