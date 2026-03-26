'use client';

import { parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

type FilterConfig = {
	key: string;
	defaultValue?: string;
};

export function useFilterState(config: FilterConfig[]) {
	const parsers = useMemo(() => {
		const result: Record<string, typeof parseAsString> = {};
		for (const { key, defaultValue } of config) {
			result[key] = defaultValue
				? parseAsString.withDefault(defaultValue)
				: parseAsString;
		}
		return result;
	}, [config]);

	const [urlState, setUrlState] = useQueryStates(parsers, {
		history: 'push',
		shallow: false,
	});

	const [pending, setPending] = useState<Record<string, string | null>>(() => ({
		...urlState,
	}));

	const defaults = useMemo(() => {
		const result: Record<string, string | null> = {};
		for (const { key, defaultValue } of config) {
			result[key] = defaultValue ?? null;
		}
		return result;
	}, [config]);

	const setFilter = useCallback((key: string, value: string | null) => {
		setPending((prev) => ({ ...prev, [key]: value }));
	}, []);

	const sync = useCallback(() => {
		setPending({ ...urlState });
	}, [urlState]);

	const applyFilters = useCallback(() => {
		setUrlState(pending);
	}, [pending, setUrlState]);

	const clearFilters = useCallback(() => {
		setPending({ ...defaults });
		setUrlState(defaults);
	}, [defaults, setUrlState]);

	const activeCount = useMemo(() => {
		let count = 0;
		for (const { key } of config) {
			if (urlState[key] && urlState[key] !== defaults[key]) {
				count++;
			}
		}
		return count;
	}, [urlState, defaults, config]);

	return {
		filters: pending,
		applied: urlState,
		setFilter,
		sync,
		applyFilters,
		clearFilters,
		hasActiveFilters: activeCount > 0,
		activeCount,
	};
}
