'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, Save, Edit2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          name: formData.name,
        }
      });

      if (updateError) throw updateError;

      // Update user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'PRODUCT_MANAGER':
        return 'default';
      case 'STAKEHOLDER':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'PRODUCT_MANAGER':
        return 'Product Manager';
      case 'STAKEHOLDER':
        return 'Stakeholder';
      case 'ADMIN':
        return 'Administrator';
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{user.name || 'User'}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                  <Badge 
                    variant={getRoleBadgeColor(user.role)} 
                    className="mt-2"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="flex-1"
                    />
                  ) : (
                    <p className="flex-1">{user.name || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="flex-1 text-muted-foreground">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update your email.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Account Role</Label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <p className="flex-1">{getRoleDisplayName(user.role)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your role determines your permissions within the application.
                </p>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name || '',
                      email: user.email || '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Read-only account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Created:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{user.id}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You will receive an email with instructions to reset your password.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}