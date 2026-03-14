import { useEffect, useState } from 'react';
import { useVerifyEmailMutation } from '@/app/store/apis/authApi';
import { Button } from './common/ui/button';
import { Card } from './common/ui/card';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface VerifyEmailPageProps {
  onGoToSignIn: () => void;
}

export function VerifyEmailPage({ onGoToSignIn }: VerifyEmailPageProps) {
  const [verifyEmail, { isLoading, isSuccess, isError, error }] = useVerifyEmailMutation();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setHasToken(!!t);
    if (t) verifyEmail({ token: t });
  }, [verifyEmail]);

  useEffect(() => {
    if (isSuccess) toast.success('Email verified. You can now sign in.');
  }, [isSuccess]);

  const errorMessage = error && 'data' in error && typeof (error.data as { error?: string })?.error === 'string'
    ? (error.data as { error: string }).error
    : 'Invalid or expired verification link. Please request a new one.';

  if (hasToken === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center border-slate-200 shadow-xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Verification link required</h1>
          <p className="text-slate-500 mt-2">No token was provided. Please use the link from your verification email.</p>
          <Button onClick={onGoToSignIn} className="mt-6 bg-blue-600 hover:bg-blue-700">
            Go to Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  if (hasToken === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center border-slate-200 shadow-xl">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold text-slate-900">Verifying your email…</h1>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center border-slate-200 shadow-xl">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold text-slate-900">Verifying your email…</h1>
          <p className="text-slate-500 mt-2">Please wait.</p>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center border-slate-200 shadow-xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Verification failed</h1>
          <p className="text-slate-500 mt-2">{errorMessage}</p>
          <Button onClick={onGoToSignIn} className="mt-6 bg-blue-600 hover:bg-blue-700">
            Go to Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center border-slate-200 shadow-xl">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Email verified</h1>
        <p className="text-slate-500 mt-2">You can now sign in with your email and password.</p>
        <Button onClick={onGoToSignIn} className="mt-6 bg-blue-600 hover:bg-blue-700">
          Sign In
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
}
