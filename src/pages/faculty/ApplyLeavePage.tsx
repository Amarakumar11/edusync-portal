// Firebase Firestore-based leave application

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { createLeaveRequest } from '@/services/leaveService';
import { createNotification } from '@/services/notificationService';

export function ApplyLeavePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
  });

  if (!user || user.role !== 'faculty') {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      toast({
        title: 'Error',
        description: 'From date must be before to date',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create leave request in Firestore
      await createLeaveRequest(
        user.email,
        user.name,
        user.erpId || 'N/A',
        user.department,
        formData.reason,
        formData.fromDate,
        formData.toDate
      );

      // Create notification for HOD in Firestore
      await createNotification(
        'admin',
        user.department,
        `New leave request from ${user.name} (${user.erpId || 'N/A'}) from ${formData.fromDate} to ${formData.toDate}`
      );

      toast({
        title: 'Success',
        description: 'Leave request sent to HOD',
      });

      // Reset form
      setFormData({
        fromDate: '',
        toDate: '',
        reason: '',
      });

      // Redirect to leave history
      setTimeout(() => {
        navigate('/faculty/leave-history');
      }, 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit leave request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apply for Leave"
        description="Submit your leave request to your HOD"
      />

      <Card>
        <CardHeader>
          <CardTitle>Leave Request Form</CardTitle>
          <CardDescription>
            Department: <span className="font-semibold">{user.department}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">From Date *</Label>
                <Input
                  id="fromDate"
                  name="fromDate"
                  type="date"
                  value={formData.fromDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">To Date *</Label>
                <Input
                  id="toDate"
                  name="toDate"
                  type="date"
                  value={formData.toDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave *</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Provide details about your leave request..."
                value={formData.reason}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/faculty')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

