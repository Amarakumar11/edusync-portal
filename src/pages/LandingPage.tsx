import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/landing/Logo';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { StatsCard } from '@/components/landing/StatsCard';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Bell, 
  FileText, 
  Users, 
  Shield,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Smart Timetables',
    description: 'Create and manage class schedules with an intuitive drag-and-drop interface.',
  },
  {
    icon: Clock,
    title: 'Leave Management',
    description: 'Streamlined leave applications with real-time status tracking.',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Stay updated with announcements and alerts in real-time.',
  },
  {
    icon: FileText,
    title: 'Exam Schedules',
    description: 'Access examination details and schedules anytime, anywhere.',
  },
  {
    icon: Users,
    title: 'Faculty Portal',
    description: 'Dedicated dashboard for faculty with personalized features.',
  },
  {
    icon: Shield,
    title: 'Secure Access',
    description: 'Role-based authentication with OTP verification for security.',
  },
];

const stats = [
  { value: '500+', label: 'Active Faculty' },
  { value: '50+', label: 'Departments' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login/faculty')}
              className="hidden sm:inline-flex"
            >
              Faculty Login
            </Button>
            <Button 
              onClick={() => navigate('/login/admin')}
              className="bg-primary hover:bg-primary/90"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient min-h-screen flex items-center pt-16">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-sm mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CheckCircle2 className="h-4 w-4" />
              Trusted by 50+ Educational Institutions
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Streamline Your College{' '}
              <span className="text-primary-foreground/80">Administration</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              EduSync is the modern, all-in-one portal for faculty and administrators. 
              Manage timetables, leaves, announcements, and more with ease.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <Button 
                size="lg" 
                onClick={() => navigate('/login/admin')}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold px-8"
              >
                Admin Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/login/faculty')}
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8"
              >
                Faculty Login
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <StatsCard 
                key={stat.label} 
                {...stat} 
                delay={500 + index * 100} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools designed specifically for educational institutions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard 
                key={feature.title} 
                {...feature} 
                delay={100 + index * 100} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join the growing community of educational institutions using EduSync to streamline their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/signup/faculty')}
                className="bg-primary hover:bg-primary/90 font-semibold px-8"
              >
                Register as Faculty
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/login/admin')}
                className="font-semibold px-8"
              >
                Admin Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo variant="light" size="sm" />
            <p className="text-sm text-sidebar-muted">
              © 2024 EduSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
