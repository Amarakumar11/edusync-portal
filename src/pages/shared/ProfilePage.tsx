import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera, Check, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db, auth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'sonner';

export function ProfilePage() {
    const { user, firebaseUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile picture state
    const [isUploading, setIsUploading] = useState(false);
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');

    // Password reset state
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [isResetting, setIsResetting] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const serverPort = 3001;
            const baseUrl = window.location.hostname === 'localhost' ? `http://localhost:${serverPort}` : '';
            const response = await fetch(`${baseUrl}/api/upload/profiles`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload image');

            const data = await response.json();
            const imageUrl = data.url;

            // Update Firestore
            if (user?.uid) {
                await updateDoc(doc(db, 'users', user.uid), { profileImage: imageUrl });
                setProfileImage(imageUrl);
                toast.success('Profile picture updated!');

                // Let's force a reload so the auth context picks up the new image.
                // In a real app we'd trigger a state update in the AuthContext.
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err) {
            console.error('Upload Error:', err);
            toast.error('Could not upload your profile picture.');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (passwords.new !== passwords.confirm) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwords.new.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }

        if (!firebaseUser || !firebaseUser.email) return;

        setIsResetting(true);
        try {
            // Re-authenticate
            const credential = EmailAuthProvider.credential(firebaseUser.email, passwords.current);
            await reauthenticateWithCredential(firebaseUser, credential);

            // Update password
            await updatePassword(firebaseUser, passwords.new);

            toast.success('Password updated successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setPasswordError('Incorrect current password.');
            } else {
                setPasswordError(err.message || 'Failed to update password.');
            }
        } finally {
            setIsResetting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="My Profile"
                description="Manage your account settings and profile picture"
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Picture Card */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5" /> Profile Picture
                        </CardTitle>
                        <CardDescription>Upload a picture to display on your profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background bg-muted shadow-md flex items-center justify-center relative group">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl text-muted-foreground uppercase">{user.name.charAt(0)}</span>
                                )}

                                {/* Upload overlay */}
                                <div
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="w-8 h-8 text-white mb-2" />
                                    <span className="text-white text-xs font-semibold">CHANGE</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center w-full">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground mb-4">{user.role.toUpperCase()} • {user.department}</p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full"
                            >
                                {isUploading ? 'Uploading...' : 'Upload New Picture'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" /> Change Password
                        </CardTitle>
                        <CardDescription>Update your login credentials securely.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            {passwordError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{passwordError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={isResetting || !passwords.current || !passwords.new || !passwords.confirm} className="w-full">
                                {isResetting ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default ProfilePage;
