import { google } from '@ai-sdk/google';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { z } from 'zod';

const model = google('gemini-3-flash-preview');

const insightItemSchema = z.object({
	text: z.string(),
	lecturerName: z.string().optional(),
	moduleName: z.string().optional(),
	schoolCode: z.string().optional(),
	rating: z.number().optional(),
	severity: z.enum(['low', 'medium', 'high']).optional(),
});

const insightCategorySchema = z.enum([
	'executive-summary',
	'strengths',
	'concerns',
	'training',
	'trends',
	'school-highlights',
	'student-sentiment',
	'action-items',
	'lecturer-spotlights',
	'category-insights',
]);

const insightCardSchema = z.object({
	category: insightCategorySchema,
	title: z.string(),
	items: z.array(insightItemSchema),
	tags: z.array(z.string()),
});

const appraisalInsightsSchema = z.object({
	cards: z.array(insightCardSchema),
	tags: z.array(z.string()),
	filterSummary: z.string(),
});

const SYSTEM_PROMPT = `You are an academic quality assurance analyst at a university.
Analyze the following appraisal data for the selected period and produce
structured insights. Be specific — reference school codes, module names,
and lecturer names where relevant. Prioritize actionable recommendations.`;

function buildPrompt(context: Record<string, unknown>): string {
	return `Data Context:
${JSON.stringify(context, null, 2)}

Instructions:
1. Generate an executive summary (3-5 sentences) as a single card with category "executive-summary".
2. Identify 3-5 key strengths with supporting data (category "strengths").
3. Identify 3-5 areas of concern with severity levels (category "concerns").
4. Suggest 3-5 specific training programs/workshops (category "training").
5. Highlight term-over-term trends (category "trends").
6. Provide per-school highlights (category "school-highlights").
7. Summarize student sentiment themes from comments (category "student-sentiment").
8. List 3-5 prioritized action items for management (category "action-items").
9. Spotlight exceptional and struggling lecturers (category "lecturer-spotlights").
10. Provide category-level insights for each feedback/observation category (category "category-insights").
11. Auto-generate 5-10 thematic tags based on the content (e.g., "Communication", "Assessment", "Punctuality"). Assign relevant tags to each card. Include all unique tags in the top-level "tags" array.
12. Generate a "filterSummary" string describing the filters applied (e.g., "Term 2025-02, All Schools").

If data for a particular category is insufficient, omit that card entirely rather than inventing data.
Output MUST conform to the provided JSON schema.`;
}

export async function generateAppraisalAIInsights(
	context: Record<string, unknown>
) {
	try {
		const { output } = await generateText({
			model,
			system: SYSTEM_PROMPT,
			output: Output.object({
				schema: appraisalInsightsSchema,
				name: 'AppraisalInsights',
				description: 'AI-generated appraisal insights with categorized cards',
			}),
			messages: [{ role: 'user', content: buildPrompt(context) }],
		});

		if (!output) {
			throw new Error('No output generated from AI model');
		}

		return {
			cards: output.cards,
			tags: output.tags,
			generatedAt: new Date().toISOString(),
			filterSummary: output.filterSummary,
		};
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			throw new Error(
				'AI could not generate structured insights. Please try again.'
			);
		}
		throw error;
	}
}
