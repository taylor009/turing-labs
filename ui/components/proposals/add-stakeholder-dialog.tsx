'use client';

import { useState, useEffect } from 'react';
import { stakeholders as stakeholdersApi, utils } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Search, Check, X, Mail } from 'lucide-react';
import { User } from '@/types/database.types';

interface AddStakeholderDialogProps {
  proposalId: string;
  existingStakeholders: Array<{ user_id: string; user: { id: string; name: string; email: string } }>;
  onStakeholderAdded: () => void;
  trigger?: React.ReactNode;
}

export function AddStakeholderDialog({
  proposalId,
  existingStakeholders,
  onStakeholderAdded,
  trigger,
}: AddStakeholderDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const results = await utils.searchUsers(searchQuery);
        
        // Filter out existing stakeholders
        const existingUserIds = existingStakeholders.map(s => s.user_id);
        const filteredResults = results.filter(user => !existingUserIds.includes(user.id));
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search failed",
          description: "Could not search for users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, existingStakeholders]);

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleInviteStakeholders = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to invite.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      // Add each selected user as a stakeholder
      for (const user of selectedUsers) {
        await stakeholdersApi.add(proposalId, user.id);
      }

      toast({
        title: "Stakeholders invited",
        description: `Successfully invited ${selectedUsers.length} stakeholder(s).`,
      });

      // Reset state
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
      setOpen(false);
      
      // Notify parent to refresh
      onStakeholderAdded();

    } catch (error) {
      console.error('Error inviting stakeholders:', error);
      toast({
        title: "Invitation failed",
        description: "Could not invite stakeholders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button size="sm" className="flex items-center gap-2">
      <UserPlus className="h-4 w-4" />
      Add Stakeholder
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Stakeholders</DialogTitle>
          <DialogDescription>
            Search and invite users to review this proposal. They will be able to approve, reject, or request changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? 'No users found' : 'Enter a search term'}
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {searchResults.map((user) => {
                      const isSelected = selectedUsers.find(u => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-muted cursor-pointer"
                          onClick={() => handleUserSelect(user)}
                        >
                          <Checkbox
                            checked={!!isSelected}
                            onChange={() => {}} // Controlled by parent click
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {user.role === 'PRODUCT_MANAGER' ? 'Product Manager' : 
                             user.role === 'ADMIN' ? 'Admin' : 'Stakeholder'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Users ({selectedUsers.length})</Label>
              <div className="border rounded-lg p-2 space-y-2 max-h-32 overflow-y-auto">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserSelect(user)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Stakeholders Info */}
          {existingStakeholders.length > 0 && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
              <p className="font-medium mb-1">Current Stakeholders:</p>
              <div className="space-y-1">
                {existingStakeholders.map((stakeholder) => (
                  <p key={stakeholder.user_id}>
                    • {stakeholder.user.name} ({stakeholder.user.email})
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInviteStakeholders}
            disabled={selectedUsers.length === 0 || submitting}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {submitting ? 'Inviting...' : `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}