import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/landing/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UserRole } from '@/types';

export function LoginPage() {
  const { role } = useParams<{ role: UserRole }>();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    erpId: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.erpId || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(
      { erpId: formData.erpId, password: formData.password },
      role as UserRole
    );

    if (result.success) {
      navigate('/verify-otp');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Logo variant="light" size="lg" className="justify-center mb-8" />
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            {isAdmin ? 'Admin Portal' : 'Faculty Portal'}
          </h2>
          <p className="text-primary-foreground/70">
            {isAdmin 
              ? 'Manage your institution with powerful administrative tools.'
              : 'Access your schedule, apply for leave, and stay connected.'}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <div className="lg:hidden mb-6">
              <Logo size="md" />
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="font-display text-2xl">
                {isAdmin ? 'Admin Login' : 'Faculty Login'}
              </CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="erpId">ERP ID</Label>
                  <Input
                    id="erpId"
                    placeholder="Enter your ERP ID"
                    value={formData.erpId}
                    onChange={(e) => setFormData(prev => ({ ...prev, erpId: e.target.value }))}
                    className="input-focus"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="input-focus pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>

                {!isAdmin && (
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link 
                      to="/signup/faculty" 
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </Link>
                  </p>
                )}

                /* {isAdmin && (
                    <div className="text-center text-xs text-muted-foreground border-t pt-4">
                    <p className="mb-1">Demo Credentials:</p>
                    <p>ERP ID: <code className="bg-muted px-1 rounded">ADMIN001</code></p>
                    <p>Password: <code className="bg-muted px-1 rounded">admin123</code></p>
                  </div> 
                )} */
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
