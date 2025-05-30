import { db } from '@/db';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq, inArray } from 'drizzle-orm';
import fs from 'fs';
import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import Google from 'next-auth/providers/google';
import path from 'path';
import {
  UserPosition,
  accounts,
  schools,
  sessions,
  students,
  userSchools,
  users,
  verificationTokens,
} from './db/schema';

interface UserData {
  name: string;
  email: string;
  position: string;
  schools?: string[];
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,

  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role;
      session.user.position = user.position;

      if (user.role === 'student') {
        const student = await db.query.students.findFirst({
          where: eq(students.userId, user.id),
        });

        session.user.stdNo = student?.stdNo;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user || !user.id || !user.email) return;

      try {
        const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
        const usersData = JSON.parse(
          fs.readFileSync(usersFilePath, 'utf8'),
        ) as UserData[];

        const userData = usersData.find((u) => u.email === user.email);

        if (userData) {
          await db
            .update(users)
            .set({
              position: userData.position as UserPosition,
              role: 'academic',
            })
            .where(eq(users.id, user.id));

          if (
            userData.schools &&
            Array.isArray(userData.schools) &&
            userData.schools.length > 0
          ) {
            const schoolCodes = userData.schools as string[];
            const schoolsData = await db
              .select()
              .from(schools)
              .where(inArray(schools.code, schoolCodes));

            for (const school of schoolsData) {
              await db
                .insert(userSchools)
                .values({
                  userId: user.id,
                  schoolId: school.id,
                })
                .onConflictDoNothing();
            }
          }
        }
      } catch (error) {
        console.error('Error in createUser event:', error);
      }
    },
  },
});
