import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/landing/Logo';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { AlertCircle, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OTPVerificationPage() {
  const navigate = useNavigate();
  const { verifyOTP, resendOTP, pendingOTP, pendingUser, isLoading, user, isAuthenticated } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : '/faculty');
    }
  }, [isAuthenticated, user, navigate]);

  // Redirect if no pending OTP
  useEffect(() => {
    if (!pendingOTP && !isLoading) {
      navigate('/');
    }
  }, [pendingOTP, isLoading, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    const result = await verifyOTP(otp);

    if (!result.success) {
      setError(result.error || 'Verification failed');
      setOtp('');
    }
  };

  const handleResend = async () => {
    setError('');
    setCanResend(false);
    setResendCooldown(30);
    
    const result = await resendOTP();
    if (!result.success) {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const maskedPhone = pendingUser?.phone 
    ? `${pendingUser.phone.slice(0, 4)}****${pendingUser.phone.slice(-2)}`
    : '****';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Verify OTP</CardTitle>
            <CardDescription>
              We've sent a verification code to<br />
              <span className="font-medium text-foreground">{maskedPhone}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">For demo, enter any 6-digit code</p>
              <p>Example: <code className="bg-muted px-2 py-0.5 rounded">123456</code></p>
            </div>

            <Button 
              onClick={handleVerify}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleResend}
                disabled={!canResend}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {canResend ? 'Resend OTP' : `Resend in ${resendCooldown}s`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OTPVerificationPage;
