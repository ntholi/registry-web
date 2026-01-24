const BASE_URL = 'https://api.paylesotho.co.ls/api/v1/vcl';

interface MpesaPaymentRequest {
	merchantId: string;
	merchantName: string;
	amount: string;
	mobileNumber: string;
	clientReference: string;
}

interface MpesaPaymentResponse {
	status_code: number | string;
	message: string;
	reference?: string;
}

interface VerifyTransactionResponse {
	status_code: string;
	message: string;
	transaction_id?: string;
	reference?: string;
}

function getConfig() {
	const apiKey = process.env.PAY_LESOTHO_API_KEY;
	const merchantId = process.env.PAY_LESOTHO_MERCHANT_ID;
	const merchantName = process.env.PAY_LESOTHO_MERCHANT_NAME;

	if (!apiKey || !merchantId || !merchantName) {
		throw new Error('Pay Lesotho configuration is incomplete');
	}

	return { apiKey, merchantId, merchantName };
}

export function normalizePhoneNumber(phone: string): string {
	let cleaned = phone.replace(/\D/g, '');
	if (cleaned.startsWith('266')) {
		cleaned = cleaned.slice(3);
	}
	if (cleaned.length !== 8) {
		throw new Error('Phone number must be 8 digits');
	}
	return cleaned;
}

export function validateMpesaNumber(phone: string): boolean {
	const normalized = normalizePhoneNumber(phone);
	return normalized.startsWith('5');
}

export function validateEcocashNumber(phone: string): boolean {
	const normalized = normalizePhoneNumber(phone);
	return normalized.startsWith('6');
}

export function generateClientReference(applicantId: string): string {
	return `APPLY-${applicantId}-${Date.now()}`;
}

export async function initiateMpesaPayment(
	amount: number,
	mobileNumber: string,
	clientReference: string
): Promise<MpesaPaymentResponse> {
	const { apiKey, merchantId, merchantName } = getConfig();
	const normalizedPhone = normalizePhoneNumber(mobileNumber);

	if (!normalizedPhone.startsWith('5')) {
		throw new Error('Invalid M-Pesa number. Must start with 5');
	}

	const payload: MpesaPaymentRequest = {
		merchantId,
		merchantName,
		amount: amount.toString(),
		mobileNumber: normalizedPhone,
		clientReference,
	};

	const body = {
		merchantid: payload.merchantId,
		amount: payload.amount,
		mobileNumber: payload.mobileNumber,
		merchantname: payload.merchantName,
		clientReference: payload.clientReference,
	};

	console.log('Pay Lesotho request:', { url: `${BASE_URL}/payment`, body });
	console.log('API Key (first 10 chars):', apiKey);
	console.log('API Key length:', apiKey.length);

	const response = await fetch(`${BASE_URL}/payment`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
			Accept: 'application/json',
		},
		body: JSON.stringify(body),
	});

	const text = await response.text();

	if (!response.ok || text.startsWith('<!DOCTYPE') || text.startsWith('<')) {
		console.error(
			'Pay Lesotho API error:',
			response.status,
			text.slice(0, 500)
		);
		return {
			status_code: response.status,
			message: `API error: ${response.status} ${response.statusText}`,
		};
	}

	try {
		return JSON.parse(text) as MpesaPaymentResponse;
	} catch {
		console.error('Pay Lesotho invalid JSON:', text.slice(0, 500));
		return {
			status_code: 500,
			message: 'Invalid response from payment provider',
		};
	}
}

export async function verifyTransaction(
	mpesaReference: string,
	serviceProviderCode = '62915'
): Promise<VerifyTransactionResponse> {
	const { apiKey } = getConfig();

	const response = await fetch(
		`${BASE_URL}/verify/${mpesaReference}/${serviceProviderCode}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
		}
	);

	const text = await response.text();

	if (!response.ok || text.startsWith('<!DOCTYPE') || text.startsWith('<')) {
		console.error(
			'Pay Lesotho verify error:',
			response.status,
			text.slice(0, 500)
		);
		return {
			status_code: String(response.status),
			message: `API error: ${response.status} ${response.statusText}`,
		};
	}

	try {
		return JSON.parse(text) as VerifyTransactionResponse;
	} catch {
		console.error('Pay Lesotho invalid JSON:', text.slice(0, 500));
		return {
			status_code: '500',
			message: 'Invalid response from payment provider',
		};
	}
}

export function isPaymentSuccessful(
	response: MpesaPaymentResponse | VerifyTransactionResponse
): boolean {
	return response.status_code === 'INS-0' || response.status_code === 0;
}

export function getPaymentErrorMessage(statusCode: number | string): string {
	if (statusCode === 400) {
		return 'Invalid mobile number, missing fields, or invalid amount';
	}
	if (statusCode === 'INS-1') {
		return 'Internal error. Please try again later';
	}
	if (statusCode === 'INS-6') {
		return 'Transaction failed. Please try again';
	}
	if (statusCode === 'INS-9') {
		return 'Request timeout. Please try again';
	}
	if (statusCode === 'INS-10') {
		return 'Duplicate transaction';
	}
	if (statusCode === 'INS-2001') {
		return 'Insufficient funds in your M-Pesa account';
	}
	return 'Payment failed. Please try again';
}
