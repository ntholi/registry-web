import { auth, signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { redirect } from 'next/navigation';
import Logo from '../base/Logo';
import GoogleIcon from './GoogleIcon';

export default async function LoginForm() {
  const session = await auth();

  if (session) {
    return redirect('/');
  }

  const handleSignIn = async () => {
    'use server';
    await signIn('google');
  };

  return (
    <div className='flex h-[94vh] items-center justify-center p-4'>
      <Logo
        width={500}
        height={500}
        className='absolute left-1/2 top-0 mt-4 h-32 w-auto -translate-x-1/2 md:mt-10'
      />
      <Card className='w-full max-w-sm mt-10'>
        <CardHeader>
          <CardTitle className='text-2xl'>Sign in</CardTitle>
          <CardDescription>
            Sign in with your Google account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignIn} className='w-full'>
            <Button className='w-full'>
              <GoogleIcon />
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
