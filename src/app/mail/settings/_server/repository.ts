import { eq } from 'drizzle-orm';
import { db } from '@/core/database';
import type { MailTriggerType } from '../../_lib/types';
import { mailTriggerSettings } from '../../_schema/mailTriggerSettings';

export async function getTriggerSettings() {
	return db.select().from(mailTriggerSettings);
}

export async function isTriggerEnabled(triggerType: MailTriggerType) {
	const [row] = await db
		.select({ enabled: mailTriggerSettings.enabled })
		.from(mailTriggerSettings)
		.where(eq(mailTriggerSettings.triggerType, triggerType));
	return row?.enabled ?? true;
}
