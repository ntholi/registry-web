import { z } from 'zod';

export const lecturesModule = z.object({
  id: z.number().optional(),
  moduleId: z.number(),
});
export type LecturesModule = z.infer<typeof lecturesModule>;
