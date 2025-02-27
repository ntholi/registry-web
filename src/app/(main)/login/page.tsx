import { auth, signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { redirect } from 'next/navigation';
import Logo from '../base/Logo';
import GoogleIcon from './GoogleIcon';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Student Portal | Sign in',
};

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
      <Card className='mt-10 w-full max-w-sm'>
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
        <CardFooter className='mt-4 rounded-b-lg bg-yellow-100 p-4 text-yellow-800'>
          <div className='flex items-start'>
            <AlertCircle className='mr-2 h-5 w-5 flex-shrink-0' />
            <p className='text-[0.8rem]'>
              This app is currently in beta testing. If you encounter any
              issues, please report them to the Registry Department.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
