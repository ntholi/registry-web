import { createServiceLogger } from './logger';

// biome-ignore lint/suspicious/noExplicitAny: transaction type from drizzle
type Constructor<T> = new (...args: any[]) => T;

export function serviceWrapper<T extends object>(
	Service: Constructor<T>,
	resourceName: string
): T {
	const logger = createServiceLogger(resourceName);

	return new Proxy(new Service(), {
		get(target: T, prop: string | symbol, receiver: unknown) {
			const originalMethod = Reflect.get(target, prop, receiver);

			if (typeof originalMethod === 'function') {
				// biome-ignore lint/suspicious/noExplicitAny: transaction type from drizzle
				return async function (...args: any[]) {
					const startTime = Date.now();
					const methodName = String(prop);

					try {
						return await originalMethod.apply(target, args);
					} catch (error) {
						const duration = Date.now() - startTime;
						logger.error(
							`Failed ${methodName} after ${duration}ms: ${
								error instanceof Error ? error.message : 'Unknown error'
							}`,
							{
								success: false,
								duration,
								error: error instanceof Error ? error.message : String(error),
								args,
							}
						);
						throw error;
					}
				};
			}

			return originalMethod;
		},
	});
}
