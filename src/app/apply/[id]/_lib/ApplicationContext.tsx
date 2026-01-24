'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

type ApplicationContextValue = {
	applicationId: string;
};

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

type Props = PropsWithChildren<{
	applicationId: string;
}>;

export function ApplicationProvider({ applicationId, children }: Props) {
	return (
		<ApplicationContext.Provider value={{ applicationId }}>
			{children}
		</ApplicationContext.Provider>
	);
}

export function useApplicationId(): string {
	const ctx = useContext(ApplicationContext);
	if (!ctx) {
		throw new Error('useApplicationId must be used within ApplicationProvider');
	}
	return ctx.applicationId;
}
