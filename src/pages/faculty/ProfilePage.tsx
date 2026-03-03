import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataCard } from '@/components/dashboard/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Phone, CreditCard, Save, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.name || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.username,
        phone: formData.phone,
      });

      setIsEditing(false);
      setSuccess(true);
      toast.success('Profile updated successfully!');

      // Optionally reload to update UI with latest user details
      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Profile"
        description="View and manage your account information"
      >
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </PageHeader>

      {success && (
        <Alert className="bg-success/10 border-success/20">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Profile updated successfully! Page will refresh.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <DataCard title="Profile Picture" className="lg:col-span-1 border-primary/10">
          <div className="flex flex-col items-center py-6">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-4 border-background shadow-lg">
              <span className="text-5xl font-display font-bold text-primary">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <h3 className="font-display font-semibold text-xl text-foreground">
              {user?.name || 'User'}
            </h3>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              {user?.role || 'Faculty'}
            </p>
            {user?.department && (
              <Badge variant="secondary" className="mt-3">
                {user.department} Dept
              </Badge>
            )}
          </div>
        </DataCard>

        {/* Details Card */}
        <DataCard title="Account Details" className="lg:col-span-2 border-primary/10">
          <div className="space-y-6 pt-4">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="username" className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                ) : (
                  <p className="text-foreground font-medium pb-2 border-b border-border/50">
                    {user?.name || 'Not set'}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                {/* Email is typically not editable easily without re-auth */}
                <p className="text-foreground font-medium pb-2 border-b border-border/50 text-muted-foreground">
                  {user?.email || 'Not set'}
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  <p className="text-foreground font-medium pb-2 border-b border-border/50">
                    {user?.phone || 'Not set'}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  ERP ID
                </Label>
                <p className="text-foreground font-medium pb-2 border-b border-border/50 text-muted-foreground">
                  {user?.erpId || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </DataCard>
      </div>
    </div>
  );
}

export default ProfilePage;
