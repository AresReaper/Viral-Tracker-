import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { User, Loader2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
];

export function UserProfileDialog() {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state when profile changes
  React.useEffect(() => {
    if (userProfile?.name) {
      setName(userProfile.name);
    }
    if (userProfile?.photoURL) {
      setSelectedAvatar(userProfile.photoURL);
    } else if (userProfile && !userProfile.photoURL) {
      // Open dialog automatically if no avatar is set
      setIsOpen(true);
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        name,
        photoURL: selectedAvatar 
      });
      toast.success('Profile updated successfully');
      setIsOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-border ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {userProfile?.photoURL ? (
            <img 
              src={userProfile.photoURL} 
              alt={userProfile.name} 
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
          )}
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Choose an avatar and update your display name.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-8 py-4">
          <div className="space-y-4 w-full">
            <Label className="text-center block text-sm font-medium text-muted-foreground">Select your Avatar</Label>
            <div className="grid grid-cols-4 gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => handleAvatarSelect(avatar)}
                  className={cn(
                    "relative h-20 w-20 rounded-full overflow-hidden border-4 transition-all hover:scale-110 active:scale-95",
                    selectedAvatar === avatar ? "border-primary ring-4 ring-primary/20" : "border-transparent hover:border-border"
                  )}
                >
                  <img src={avatar} alt="Avatar option" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-[1px]">
                      <Check className="h-8 w-8 text-primary-foreground drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={userProfile?.email || ''} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isUpdating || (name === userProfile?.name && selectedAvatar === userProfile?.photoURL)}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
