import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import { loginWithEmailPassword } from '@/demoAuth';

// ⚠️ DEMO MODE: Using hardcoded demo credentials
// For production, replace with real Firebase Auth

export function LoginPage() {
  const { role } = useParams<{ role?: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithEmailPassword(formData.email, formData.password);
      
      // Verify role matches the page they're on
      if (isAdmin && user.role !== 'admin') {
        setError('This account is not an admin account');
        setIsLoading(false);
        return;
      }
      if (!isAdmin && user.role !== 'faculty') {
        setError('This account is not a faculty account');
        setIsLoading(false);
        return;
      }

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/faculty');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
