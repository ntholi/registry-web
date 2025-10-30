import { auth } from '@/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const { accounts } = schema;

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const returnUrl = searchParams.get('state') || '/dashboard/lists/graduation';

  if (!code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      `${process.env.AUTH_URL}/api/auth/google-sheets`
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets'],
      prompt: 'consent',
      state: returnUrl,
    });

    return NextResponse.redirect(authUrl);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
    `${process.env.AUTH_URL}/api/auth/google-sheets`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(eq(accounts.userId, session.user.id), eq(accounts.provider, 'google'))
      )
      .limit(1);

    if (account) {
      const existingScopes = account.scope ? account.scope.split(' ') : [];
      const newScope = 'https://www.googleapis.com/auth/spreadsheets';

      if (!existingScopes.includes(newScope)) {
        existingScopes.push(newScope);
      }

      await db
        .update(accounts)
        .set({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || account.refresh_token,
          expires_at: tokens.expiry_date
            ? Math.floor(tokens.expiry_date / 1000)
            : null,
          scope: existingScopes.join(' '),
        })
        .where(
          and(
            eq(accounts.userId, session.user.id),
            eq(accounts.provider, 'google')
          )
        );
    }

    return NextResponse.redirect(new URL(returnUrl, request.url));
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}
