import '../src/core/database/env-load';
import fs from 'node:fs';
import path from 'node:path';

const ZOHO_BOOKS_CLIENT_ID = process.env.ZOHO_BOOKS_CLIENT_ID!;
const ZOHO_BOOKS_CLIENT_SECRET = process.env.ZOHO_BOOKS_CLIENT_SECRET!;
const ZOHO_BOOKS_REFRESH_TOKEN = process.env.ZOHO_BOOKS_REFRESH_TOKEN!;
const ZOHO_BOOKS_ORGANIZATION_ID = process.env.ZOHO_BOOKS_ORGANIZATION_ID!;
const ACCOUNTS_URL =
	process.env.ZOHO_BOOKS_ACCOUNTS_URL ?? 'https://accounts.zoho.com';
const API_BASE =
	process.env.ZOHO_BOOKS_API_BASE_URL ?? 'https://www.zohoapis.com/books/v3';

interface TokenResponse {
	access_token?: string;
	expires_in?: number;
	error?: string;
}

interface ReportingTag {
	tag_id: string;
	tag_name: string;
	tag_options: string;
	is_active: boolean;
}

interface ReportingTagsResponse {
	code: number;
	message: string;
	reporting_tags: ReportingTag[];
}

interface TagDetailOption {
	tag_option_id: string;
	tag_option_name: string;
	is_active: boolean;
}

interface TagDetailResponse {
	code: number;
	message: string;
	reporting_tag: {
		tag_id: string;
		tag_name: string;
		tag_options: TagDetailOption[];
	};
}

interface CustomField {
	field_id: string;
	label: string;
	api_name: string;
	data_type: string;
	is_active: boolean;
	index: number;
}

async function getAccessToken(): Promise<string> {
	const params = new URLSearchParams({
		refresh_token: ZOHO_BOOKS_REFRESH_TOKEN,
		client_id: ZOHO_BOOKS_CLIENT_ID,
		client_secret: ZOHO_BOOKS_CLIENT_SECRET,
		grant_type: 'refresh_token',
	});

	const response = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params.toString(),
	});

	const data = (await response.json()) as TokenResponse;
	if (!data.access_token) {
		throw new Error(
			`Token refresh failed: ${data.error ?? response.statusText}`
		);
	}
	return data.access_token;
}

async function zohoGet<T>(
	token: string,
	endpoint: string,
	params: Record<string, string> = {}
): Promise<T> {
	const searchParams = new URLSearchParams({
		organization_id: ZOHO_BOOKS_ORGANIZATION_ID,
		...params,
	});

	const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
	const response = await fetch(url, {
		headers: { Authorization: `Zoho-oauthtoken ${token}` },
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Zoho API error [${response.status}]: ${text}`);
	}

	return (await response.json()) as T;
}

function toIdentifier(name: string): string {
	return name
		.replace(/[^a-zA-Z0-9_]/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_|_$/g, '');
}

function toCamelCase(str: string): string {
	const id = toIdentifier(str);
	const parts = id.split('_');
	return parts
		.map((p, i) =>
			i === 0
				? p.toLowerCase()
				: p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
		)
		.join('');
}

async function main() {
	console.log('Authenticating with Zoho Books...');
	const token = await getAccessToken();
	console.log('Authenticated successfully.\n');

	console.log('Fetching reporting tags...');
	const tagsResponse = await zohoGet<ReportingTagsResponse>(
		token,
		'/settings/tags'
	);
	const reportingTags = tagsResponse.reporting_tags ?? [];
	console.log(`Found ${reportingTags.length} reporting tag(s).`);

	const tagIds: Record<string, string> = {};
	const tagOptions: Record<string, Record<string, string>> = {};

	for (const tag of reportingTags) {
		console.log(
			`\nFetching options for tag: ${tag.tag_name} (${tag.tag_id})...`
		);
		const detailResponse = await zohoGet<TagDetailResponse>(
			token,
			`/settings/tags/${tag.tag_id}`
		);
		const detail = detailResponse.reporting_tag;
		const options = detail.tag_options ?? [];

		const key = toCamelCase(tag.tag_name);
		tagIds[key] = tag.tag_id;

		const optMap: Record<string, string> = {};
		for (const opt of options) {
			optMap[opt.tag_option_name] = opt.tag_option_id;
			console.log(`  • ${opt.tag_option_name} → ${opt.tag_option_id}`);
		}
		tagOptions[key] = optMap;
	}

	console.log('\nFetching contact custom fields...');
	const fieldsResponse = await zohoGet<{
		code: number;
		customfields: Record<string, CustomField[]>;
	}>(token, '/settings/customfields', { entity: 'contact' });
	const contactFields = fieldsResponse.customfields?.contact ?? [];
	console.log(`Found ${contactFields.length} contact custom field(s).`);

	const customFields: Record<
		string,
		{ fieldId: string; label: string; apiName: string }
	> = {};
	for (const field of contactFields) {
		const key = toCamelCase(field.label);
		customFields[key] = {
			fieldId: field.field_id,
			label: field.label,
			apiName: field.api_name,
		};
		console.log(`  - ${field.label} (${field.field_id}) [${field.data_type}]`);
	}

	const config = {
		tagIds,
		tagOptions,
		customFields,
	};

	const outPath = path.resolve(
		__dirname,
		'../src/app/finance/_lib/zoho-books/zoho-config.json'
	);
	fs.writeFileSync(outPath, JSON.stringify(config, null, '\t'));
	console.log(`\nConfig written to: ${outPath}`);
	console.log('\nDone!');
}

main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
