import { z } from 'zod/v4';

export const assignToRoleSchema = z.object({
	mailAccountId: z.string(),
	role: z.string(),
	canCompose: z.boolean().optional().default(false),
	canReply: z.boolean().optional().default(true),
});

export const assignToUserSchema = z.object({
	mailAccountId: z.string(),
	userId: z.string(),
	canCompose: z.boolean().optional().default(false),
	canReply: z.boolean().optional().default(true),
});
