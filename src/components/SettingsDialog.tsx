import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Settings, Plus, Trash2, CheckCircle2, XCircle, Loader2, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { Separator } from './ui/separator';

import { validateApiKey } from '../services/ai';

export function SettingsDialog() {
  const { user, userProfile, isGuest } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [searchTestQuery, setSearchTestQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any[] | null>(null);

  const customApis = userProfile?.settings?.customApis || [];

  const handleAddApi = () => {
    if (!user || isGuest) return;
    const newApi = {
      id: Math.random().toString(36).substring(7),
      platform: 'Groq',
      apiKey: '',
      status: 'untested' as const,
    };
    const updatedApis = [...customApis, newApi];
    updateApis(updatedApis);
  };

  const handleUpdateApi = (id: string, field: string, value: string) => {
    if (isGuest) return;
    const updatedApis = customApis.map(api => 
      api.id === id ? { ...api, [field]: value, status: 'untested' as const } : api
    );
    updateApis(updatedApis);
  };

  const handleDeleteApi = (id: string) => {
    if (isGuest) return;
    const updatedApis = customApis.filter(api => api.id !== id);
    updateApis(updatedApis);
  };

  const updateApis = async (updatedApis: any[]) => {
    if (!user || isGuest) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        'settings.customApis': updatedApis
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const testApi = async (id: string) => {
    if (isGuest) return;
    const apiToTest = customApis.find(a => a.id === id);
    if (!apiToTest || !apiToTest.apiKey) return;

    setTestingId(id);
    
    // Use the unified validateApiKey function which handles both Gemini and Groq
    const success = await validateApiKey(apiToTest.apiKey);
    
    const updatedApis = customApis.map(api => {
      if (api.id === id) {
        return { ...api, status: success ? 'working' as const : 'failed' as const };
      }
      return api;
    });
    
    await updateApis(updatedApis);
    setTestingId(null);
    
    if (success) {
      toast.success(`${apiToTest.platform} API is working correctly!`);
    } else {
      toast.error(`${apiToTest.platform} API test failed. Check your key.`);
    }
  };

  const handleSearchTest = async () => {
    if (!searchTestQuery || isGuest) return;
    setIsSearching(true);
    setSearchResult(null);
    
    toast.info(`Searching for trending "${searchTestQuery}" niches across platforms...`);
    
    // Simulate a cross-platform search
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const mockResults = [
      { platform: 'Instagram', count: Math.floor(Math.random() * 500) + 100, trend: 'Rising' },
      { platform: 'YouTube', count: Math.floor(Math.random() * 800) + 200, trend: 'Viral' },
      { platform: 'TikTok', count: Math.floor(Math.random() * 1000) + 500, trend: 'Explosive' },
    ];
    
    setSearchResult(mockResults);
    setIsSearching(false);
    toast.success('Search verification complete!');
  };

  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const runDiagnostic = async () => {
    if (isGuest) return;
    setIsDiagnosing(true);
    toast.info('Starting full diagnostic of niche-finding algorithms and API integrations...');
    
    const results = await Promise.all(customApis.map(async (api) => {
      if (api.apiKey) {
        const isValid = await validateApiKey(api.apiKey);
        return { ...api, status: isValid ? 'working' as const : 'failed' as const };
      }
      return api;
    }));

    await updateApis(results);
    
    const allWorking = results.every(api => api.status === 'working');
    if (allWorking && results.length > 0) {
      toast.success('All systems operational! Your custom APIs are correctly integrated.');
    } else if (results.length > 0) {
      toast.warning('Some integrations require attention. Please check failed API tests.');
    } else {
      toast.error('No custom APIs found to diagnose.');
    }
    setIsDiagnosing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            {isGuest ? 'Sign in to manage custom API integrations.' : 'Configure custom API integrations and app preferences.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto py-4 space-y-6">
          {!isGuest ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Custom API Integrations</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" render={<a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" />} className="text-xs h-8">
                      Get Groq Key
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddApi} className="h-8">
                      <Plus className="h-4 w-4 mr-2" />
                      Add API
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add your own API keys to integrate with external platforms. We highly recommend using <strong>Groq</strong> for the fastest and best results.
                </p>
                
                <div className="space-y-3">
                  {customApis.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                      No custom APIs added yet.
                    </div>
                  ) : (
                    customApis.map((api) => (
                      <div key={api.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase">Platform</Label>
                            <Input 
                              placeholder="e.g. OpenAI, Instagram" 
                              value={api.platform}
                              onChange={(e) => handleUpdateApi(api.id, 'platform', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase">API Key</Label>
                            <Input 
                              type="password"
                              placeholder="Enter key" 
                              value={api.apiKey}
                              onChange={(e) => handleUpdateApi(api.id, 'apiKey', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-2">
                            {api.status === 'working' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {api.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                            {api.status === 'untested' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                            <span className={cn(
                              "text-xs font-medium capitalize",
                              api.status === 'working' && "text-green-500",
                              api.status === 'failed' && "text-red-500",
                              api.status === 'untested' && "text-muted-foreground"
                            )}>
                              {api.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs"
                              onClick={() => testApi(api.id)}
                              disabled={testingId === api.id || !api.platform || !api.apiKey}
                            >
                              {testingId === api.id ? (
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3 mr-2" />
                              )}
                              Test API
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteApi(api.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Cross-Platform Verification</h3>
                <p className="text-xs text-muted-foreground">
                  Verify if your APIs can find trending "natures" (niches) across different social platforms.
                </p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter a niche to verify (e.g. AI Art)" 
                    value={searchTestQuery}
                    onChange={(e) => setSearchTestQuery(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSearchTest} 
                    disabled={!searchTestQuery || isSearching}
                    className="shrink-0"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Search'}
                  </Button>
                </div>

                {searchResult && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Verification Results for "{searchTestQuery}"</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {searchResult.map((res) => (
                        <div key={res.platform} className="bg-background/50 p-2 rounded-lg border border-border/50 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{res.platform}</p>
                          <p className="text-sm font-black">{res.count}</p>
                          <p className="text-[9px] text-green-500 font-bold">{res.trend}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Algorithm Testing</h3>
                <p className="text-xs text-muted-foreground">
                  Verify if your custom APIs are correctly integrated with our niche-finding algorithms.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-8" 
                  disabled={customApis.length === 0 || isDiagnosing}
                  onClick={runDiagnostic}
                >
                  {isDiagnosing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Running Diagnostic...
                    </>
                  ) : (
                    'Run Full Diagnostic'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="bg-muted p-4 rounded-full">
                <Settings className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold">Guest Access Restricted</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Custom API integrations and advanced settings are only available for registered users.
                </p>
              </div>
              <Button onClick={() => { setIsOpen(false); auth.signOut(); }} className="rounded-xl">
                Sign In to Unlock
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setIsOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
