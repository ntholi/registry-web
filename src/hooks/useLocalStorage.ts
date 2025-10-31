import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue?: T) {
	const [storedValue, setStoredValue] = useState<T | undefined>(initialValue);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		if (typeof window !== 'undefined') {
			try {
				const item = window.localStorage.getItem(key);
				if (item) {
					setStoredValue(JSON.parse(item));
				}
			} catch (error) {
				console.warn(`Error reading localStorage key "${key}":`, error);
			}
		}
	}, [key]);

	const setValue = (value: T | ((val: T | undefined) => T)) => {
		try {
			const valueToStore = value instanceof Function ? value(storedValue) : value;

			setStoredValue(valueToStore);

			if (typeof window !== 'undefined') {
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
			}
		} catch (error) {
			console.warn(`Error setting localStorage key "${key}":`, error);
		}
	};

	const remove = () => {
		try {
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem(key);
			}
			setStoredValue(initialValue);
		} catch (error) {
			console.warn(`Error removing localStorage key "${key}":`, error);
		}
	};

	return [mounted ? storedValue : initialValue, setValue, remove] as const;
}
