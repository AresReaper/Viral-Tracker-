import { GoogleGenAI } from "@google/genai";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTrendingNiches, getPersonalizedNiches, generateViralScript, generateQuickPrompt, TrendingNiche, ViralScript } from '../services/ai';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button, buttonVariants } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, TrendingUp, Instagram, Youtube, Sparkles, LogOut, FileText, Hash, Wrench, Scissors, Filter, ArrowUpDown, PlayCircle, ExternalLink, Moon, Sun, Palette, Download, Share2, Twitter, Facebook, Linkedin, Home, Bookmark, Settings as SettingsIcon, User as UserIcon, Menu, X, ChevronRight, Search, Trash2, RefreshCw, Info, BarChart3 } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { UserProfileDialog } from '../components/UserProfileDialog';
import { SettingsDialog } from '../components/SettingsDialog';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Dashboard() {
  const { user, userProfile, isGuest, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [niches, setNiches] = useState<TrendingNiche[]>([]);
  const [savedScripts, setSavedScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeScript, setActiveScript] = useState<ViralScript | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score-desc');
  const [quickPromptInput, setQuickPromptInput] = useState('');
  const [quickPromptResult, setQuickPromptResult] = useState('');
  const [isGeneratingQuickPrompt, setIsGeneratingQuickPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('trends'); // For mobile/tablet view
  const [direction, setDirection] = useState(0);
  const [selectedApiKey, setSelectedApiKey] = useState<string | undefined>(undefined);

  // Set default API key if user has one
  useEffect(() => {
    if (userProfile?.settings?.customApis) {
      // Find the first working API key
      const workingApi = userProfile.settings.customApis.find(api => api.status === 'working');
      
      if (workingApi) {
        if (selectedApiKey !== workingApi.apiKey) {
          console.log(`Switching to working custom API: ${workingApi.platform}`);
          setSelectedApiKey(workingApi.apiKey);
        }
      } else if (selectedApiKey !== undefined) {
        console.log("No working custom API found, switching to default.");
        setSelectedApiKey(undefined);
      }
    }
  }, [userProfile?.settings?.customApis, selectedApiKey]);

  const handleTabChange = (newTab: string) => {
    const tabs = ['trends', 'generator', 'analytics', 'saved', 'settings'];
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const handleQuickPromptGenerate = async () => {
    if (!quickPromptInput.trim()) {
      toast.error('Please describe your video theme first');
      return;
    }
    
    setIsGeneratingQuickPrompt(true);
    try {
      const result = await generateQuickPrompt(quickPromptInput, selectedApiKey);
      setQuickPromptResult(result);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate quick prompt');
    } finally {
      setIsGeneratingQuickPrompt(false);
    }
  };
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [showIgDialog, setShowIgDialog] = useState(false);
  const [connectingIg, setConnectingIg] = useState(false);

  useEffect(() => {
    // Check if user has already connected Instagram
    if (user) {
      const igToken = localStorage.getItem(`ig_token_${user.uid}`);
      if (igToken) {
        setIsInstagramConnected(true);
      } else {
        // Prompt for connection if not connected and haven't declined recently
        const declined = sessionStorage.getItem(`ig_declined_${user.uid}`);
        if (!declined) {
          setShowIgDialog(true);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && user) {
        const token = event.data.token;
        localStorage.setItem(`ig_token_${user.uid}`, token);
        setIsInstagramConnected(true);
        setShowIgDialog(false);
        toast.success('Instagram connected successfully!');
        
        // Fetch personalized niches
        fetchPersonalizedNiches(token);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setConnectingIg(false);
        toast.error('Failed to connect Instagram: ' + event.data.error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const fetchPersonalizedNiches = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/instagram/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch media');
      
      const { media } = await response.json();
      const personalizedNiches = await getPersonalizedNiches(media, selectedApiKey);
      
      if (personalizedNiches.length > 0) {
        setNiches(personalizedNiches);
        toast.success('Found personalized niches based on your content!');
      } else {
        toast.error('Could not find personalized niches, showing general trends.');
        fetchGeneralNiches();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze Instagram content');
      fetchGeneralNiches();
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralNiches = async () => {
    setLoading(true);
    try {
      const data = await getTrendingNiches(selectedApiKey);
      setNiches(data);
    } catch (error) {
      toast.error('Failed to load trending niches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isInstagramConnected) {
      const token = localStorage.getItem(`ig_token_${user.uid}`);
      if (token) {
        fetchPersonalizedNiches(token);
      } else {
        fetchGeneralNiches();
      }
    } else {
      fetchGeneralNiches();
    }
  }, [user, isInstagramConnected, selectedApiKey]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'scripts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scripts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedScripts(scripts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scripts');
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleConnectInstagram = async () => {
    setConnectingIg(true);
    try {
      const redirectUri = `${window.location.origin}/api/auth/instagram/callback`;
      const response = await fetch(`/api/auth/instagram/url?uid=${user?.uid}&redirectUri=${encodeURIComponent(redirectUri)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
      
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        setConnectingIg(false);
        toast.error('Please allow popups for this site to connect your account.');
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      setConnectingIg(false);
      toast.error(error.message || 'Failed to start Instagram connection');
    }
  };

  const handleDeclineInstagram = () => {
    if (user) {
      sessionStorage.setItem(`ig_declined_${user.uid}`, 'true');
    }
    setShowIgDialog(false);
  };

  const handleGenerateScript = async (niche: TrendingNiche) => {
    setGenerating(niche.id);
    try {
      const script = await generateViralScript(niche.name, niche.platform, selectedApiKey);
      setActiveScript(script);
      toast.success('Script generated! Review and save it to your library.');
    } catch (error) {
      toast.error('Failed to generate script');
    } finally {
      setGenerating(null);
    }
  };

  const handleSaveScript = async (script: ViralScript) => {
    if (!user) {
      toast.error('Please sign in to save scripts');
      return;
    }

    try {
      await addDoc(collection(db, 'scripts'), {
        ...script,
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Script saved to your library!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scripts');
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    try {
      await deleteDoc(doc(db, 'scripts', scriptId));
      toast.success('Script removed from your library');
      if (activeScript && (activeScript as any).id === scriptId) {
        setActiveScript(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'scripts');
    }
  };

  const shareToTwitter = (niche: TrendingNiche) => {
    const text = `Check out this trending niche: ${niche.name} (Trend Score: ${niche.trendScore}/100) on ViralTracker! 🚀\n\n${niche.description}`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToFacebook = (niche: TrendingNiche) => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToLinkedIn = (niche: TrendingNiche) => {
    const url = window.location.href;
    const title = `Trending Niche: ${niche.name}`;
    const summary = niche.description;
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`, '_blank');
  };

  const filteredAndSortedNiches = niches
    .filter(niche => {
      if (platformFilter === 'all') return true;
      if (platformFilter === 'instagram') return niche.platform === 'instagram' || niche.platform === 'both';
      if (platformFilter === 'youtube') return niche.platform === 'youtube' || niche.platform === 'both';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score-desc') return b.trendScore - a.trendScore;
      if (sortBy === 'score-asc') return a.trendScore - b.trendScore;
      return 0;
    });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col h-screen overflow-hidden"
    >
      <header className="bg-card border-b border-border sticky top-0 z-20 transition-colors duration-300 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => handleTabChange('trends')}
          >
            <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors duration-300">
              ViralTracker
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {!isGuest && (
              isInstagramConnected ? (
                <span className="text-sm text-primary flex items-center bg-primary/10 px-3 py-1.5 rounded-xl font-black border border-primary/30 shadow-sm">
                  <Instagram className="w-4 h-4 mr-1.5" />
                  Connected
                </span>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setShowIgDialog(true)} 
                  className="font-black rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all px-5 flex flex-col items-center justify-center h-10"
                >
                  <span className="text-[8px] bg-primary/20 text-primary px-1.5 rounded-full mb-0.5">BETA</span>
                  <div className="flex items-center">
                    <Instagram className="w-4 h-4 mr-2" />
                    Connect IG
                  </div>
                </Button>
              )
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleTabChange('analytics')} 
              className={cn(
                "font-black rounded-xl transition-all tracking-tight", 
                activeTab === 'analytics' 
                  ? "text-primary bg-primary/15 shadow-md border border-primary/30 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/about')} 
              className="text-muted-foreground hover:text-foreground font-black rounded-xl hover:bg-muted/50 transition-all"
            >
              <Info className="w-4 h-4 mr-2" />
              About Us
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Download className="w-4 h-4" />
                    <span className="sr-only">Download App</span>
                  </Button>
                } />
                <TooltipContent>
                  <p>Android App build in progress...</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!isGuest && (
              <>
                {userProfile?.settings?.customApis && userProfile.settings.customApis.length > 0 && (
                  <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <div className="flex items-center truncate">
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-primary shrink-0" />
                        <SelectValue placeholder="Select AI Engine" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={undefined as any}>
                        Default (System)
                      </SelectItem>
                      {userProfile.settings.customApis.map((api) => (
                        <SelectItem key={api.id} value={api.apiKey} disabled={api.status === 'failed'}>
                          <div className="flex items-center justify-between w-full">
                            <span>{api.platform}</span>
                            {api.status === 'working' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2" />}
                            {api.status === 'failed' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-2" />}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <UserProfileDialog />
                <SettingsDialog />
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 dracula:-rotate-90 dracula:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dracula:rotate-0 dark:scale-0" />
                  <Palette className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dracula:rotate-0 dracula:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dracula")}>
                  Dracula
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              {isGuest ? 'Exit Guest' : 'Sign Out'}
            </Button>
          </div>

          {/* Mobile Header Actions */}
          <div className="flex md:hidden items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/about')} className="text-muted-foreground hover:text-foreground font-black">
              <Info className="h-4 w-4 mr-1" />
              About Us
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Palette className="h-5 w-5" />
                </Button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dracula")}>Dracula</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={logout} className="h-9 w-9 text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {isGuest && (activeTab === 'saved' || activeTab === 'settings' || activeTab === 'analytics') && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            {activeTab === 'saved' ? <Bookmark className="w-12 h-12 text-primary" /> : 
             activeTab === 'settings' ? <SettingsIcon className="w-12 h-12 text-primary" /> :
             <BarChart3 className="w-12 h-12 text-primary" />}
          </div>
          <h2 className="text-2xl font-bold">
            {activeTab === 'saved' ? 'Sign in to save blueprints' : 
             activeTab === 'settings' ? 'Account Settings' :
             'Advanced Analytics'}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {activeTab === 'saved' ? 'Guest users cannot save scripts to their library. Sign in with Google to build your personal collection of viral ideas.' : 
             activeTab === 'settings' ? 'Settings are only available for registered users. Sign in to manage your profile and preferences.' :
             'Analytics are only available for registered users. Sign in to track your performance and reach velocity.'}
          </p>
          <Button onClick={logout} className="rounded-xl h-12 px-8">
            Sign In Now
          </Button>
        </div>
      )}

      {(!isGuest || (activeTab !== 'saved' && activeTab !== 'settings' && activeTab !== 'analytics')) && (
        <div className="flex-1 overflow-y-auto relative bg-background/50">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full"
          >
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
              {/* Common Dialogs */}
              <Dialog open={showIgDialog} onOpenChange={setShowIgDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center text-xl font-bold">
                      <Instagram className="w-6 h-6 mr-2 text-pink-600" />
                      Connect Instagram
                      <span className="ml-2 bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        BETA
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                      Connect your Instagram account to let our AI analyze your recent posts and find highly personalized trending niches that fit your exact style.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={handleDeclineInstagram} className="rounded-xl h-12">
                      Skip for now
                    </Button>
                    <Button onClick={handleConnectInstagram} disabled={connectingIg} className="rounded-xl h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none">
                      {connectingIg ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Instagram className="w-5 h-5 mr-2" />}
                      Connect Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Tab Content Rendering */}
              {activeTab === 'trends' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">Trending Niches</h1>
                    <p className="text-muted-foreground">Discover what's going viral right now.</p>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                      <div className="flex items-center space-x-2 shrink-0">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={platformFilter} onValueChange={setPlatformFilter}>
                          <SelectTrigger className="w-[130px] rounded-xl border-none bg-background/50">
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Platforms</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 shrink-0">
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[150px] rounded-xl border-none bg-background/50">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="score-desc">Highest Score</SelectItem>
                            <SelectItem value="score-asc">Lowest Score</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-primary/20" />
                        <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                      </div>
                      <p className="text-muted-foreground font-medium">Analyzing global trends...</p>
                    </div>
                  ) : filteredAndSortedNiches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAndSortedNiches.map((niche) => (
                        <Card key={niche.id} className="flex flex-col border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden group">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex space-x-2">
                                {(niche.platform === 'instagram' || niche.platform === 'both') && (
                                  <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-pink-500/20">
                                    <Instagram className="w-4 h-4" />
                                  </div>
                                )}
                                {(niche.platform === 'youtube' || niche.platform === 'both') && (
                                  <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-500/20">
                                    <Youtube className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="bg-primary/10 text-primary text-xs font-black px-3 py-1.5 rounded-full flex items-center border border-primary/20">
                                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                                {niche.trendScore}%
                              </div>
                            </div>
                            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{niche.name}</CardTitle>
                            <CardDescription className="line-clamp-2 text-sm leading-relaxed">{niche.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow flex flex-col gap-5">
                            <div className="bg-muted/50 p-4 rounded-2xl text-sm text-muted-foreground border border-border/50">
                              <span className="font-bold text-foreground block mb-1.5 text-xs uppercase tracking-wider">Viral Insight:</span>
                              <p className="line-clamp-3 leading-relaxed italic">"{niche.reason}"</p>
                            </div>
                            
                            {niche.examples && niche.examples.length > 0 && (
                              <div className="space-y-3">
                                <span className="font-bold text-xs text-muted-foreground uppercase tracking-widest flex items-center">
                                  <PlayCircle className="w-4 h-4 mr-2 text-primary" />
                                  Reference Content
                                </span>
                                <div className="space-y-2">
                                  {niche.examples.slice(0, 2).map((example, idx) => {
                                    const formatUrl = (rawUrl: string) => {
                                      if (!rawUrl) return '#';
                                      let url = rawUrl.trim();
                                      if (url.startsWith('//')) url = 'https:' + url;
                                      if (!url.startsWith('http')) url = 'https://' + url;
                                      return url;
                                    };
                                    const url = formatUrl(example.url);
                                    return (
                                      <a 
                                        key={idx} 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block p-3 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group/item cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-semibold truncate pr-4">{example.title}</span>
                                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/item:translate-x-1 transition-transform" />
                                        </div>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="pt-2 pb-6 px-6 flex flex-col gap-3 relative">
                            <div className="flex gap-3 w-full">
                              <Dialog>
                                <DialogTrigger render={
                                  <Button 
                                    className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all" 
                                    onClick={() => handleGenerateScript(niche)}
                                    disabled={generating === niche.id}
                                  >
                                    {generating === niche.id ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Craft Script
                                      </>
                                    )}
                                  </Button>
                                } />
                              {activeScript && generating !== niche.id && (
                                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b flex items-center justify-between">
                                    <DialogHeader className="text-left">
                                      <DialogTitle className="text-2xl font-black flex items-center">
                                        <Sparkles className="w-6 h-6 mr-3 text-yellow-500" />
                                        Viral Blueprint
                                      </DialogTitle>
                                      <DialogDescription className="text-base font-medium">
                                        Optimized for {activeScript.platform} • {activeScript.niche}
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    {!isGuest && (
                                      (activeScript as any).id ? (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="rounded-xl font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                                          onClick={() => handleDeleteScript((activeScript as any).id)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </Button>
                                      ) : (
                                        !savedScripts.some(s => s.content === activeScript.content) && (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="rounded-xl font-bold border-primary/20 hover:bg-primary hover:text-primary-foreground"
                                            onClick={() => handleSaveScript(activeScript)}
                                          >
                                            <Bookmark className="w-4 h-4 mr-2" />
                                            Save
                                          </Button>
                                        )
                                      )
                                    )}
                                  </div>
                                  
                                  <Tabs defaultValue="script" className="flex-grow flex flex-col overflow-hidden">
                                    <div className="px-6 pt-4 bg-muted/30">
                                      <TabsList className="grid w-full grid-cols-5 h-12 bg-background/50 p-1 rounded-xl">
                                        <TabsTrigger value="script" className="rounded-lg"><FileText className="w-4 h-4"/></TabsTrigger>
                                        <TabsTrigger value="image" className="rounded-lg"><Sparkles className="w-4 h-4"/></TabsTrigger>
                                        <TabsTrigger value="tags" className="rounded-lg"><Hash className="w-4 h-4"/></TabsTrigger>
                                        <TabsTrigger value="tools" className="rounded-lg"><Wrench className="w-4 h-4"/></TabsTrigger>
                                        <TabsTrigger value="watermark" className="rounded-lg"><Scissors className="w-4 h-4"/></TabsTrigger>
                                      </TabsList>
                                    </div>
                                    
                                    <ScrollArea className="flex-grow p-6">
                                      <TabsContent value="script" className="m-0 space-y-6">
                                        <div className="bg-card p-6 rounded-2xl border shadow-inner font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                          {activeScript.content}
                                        </div>
                                        <Button 
                                          className="w-full h-12 rounded-xl font-bold"
                                          onClick={() => {
                                            navigator.clipboard.writeText(activeScript.content);
                                            toast.success('Script copied!');
                                          }}
                                        >
                                          Copy Full Script
                                        </Button>
                                      </TabsContent>

                                      <TabsContent value="image" className="m-0 space-y-6">
                                        <div className="bg-yellow-500/5 border-2 border-dashed border-yellow-500/20 p-6 rounded-2xl">
                                          <h4 className="text-xs font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400 mb-4">AI Visual Prompt</h4>
                                          <p className="text-base italic leading-relaxed font-serif">
                                            {activeScript.imagePrompt}
                                          </p>
                                        </div>
                                        <Button 
                                          className="w-full h-12 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-600 text-black"
                                          onClick={() => {
                                            navigator.clipboard.writeText(activeScript.imagePrompt);
                                            toast.success('Prompt copied!');
                                          }}
                                        >
                                          Copy Visual Prompt
                                        </Button>
                                      </TabsContent>
                                      
                                      <TabsContent value="tags" className="m-0 space-y-6">
                                        <div className="flex flex-wrap gap-2">
                                          {activeScript.tags.map((tag, i) => (
                                            <span key={i} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/10">
                                              {tag.startsWith('#') ? tag : `#${tag}`}
                                            </span>
                                          ))}
                                        </div>
                                      </TabsContent>
                                      
                                      <TabsContent value="tools" className="m-0 space-y-4">
                                        {Array.isArray(activeScript.tools) && activeScript.tools.map((tool: any, i) => {
                                          const formatUrl = (rawUrl: string) => {
                                            if (!rawUrl) return '#';
                                            let url = rawUrl.trim();
                                            if (url.startsWith('//')) url = 'https:' + url;
                                            if (!url.startsWith('http')) url = 'https://' + url;
                                            return url;
                                          };
                                          const toolUrl = formatUrl(tool.url);
                                          return (
                                            <div key={i} className="p-4 bg-card rounded-2xl border flex items-center justify-between group">
                                              <div className="flex items-center">
                                                <div className="bg-primary/10 p-2.5 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                                                  <Wrench className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                  <p className="font-bold text-sm">{typeof tool === 'string' ? tool : tool.name}</p>
                                                  {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
                                                </div>
                                              </div>
                                              {tool.url && (
                                                <a 
                                                  href={toolUrl} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-12 w-12 rounded-2xl shrink-0 border-border/50 cursor-pointer")}
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <ExternalLink className="w-4 h-4" />
                                                </a>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </TabsContent>

                                      <TabsContent value="watermark" className="m-0">
                                        <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl flex items-start">
                                          <Scissors className="w-6 h-6 text-blue-500 mr-4 shrink-0" />
                                          <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-300">
                                            {activeScript.watermarkTips}
                                          </p>
                                        </div>
                                      </TabsContent>
                                    </ScrollArea>
                                  </Tabs>
                                </DialogContent>
                              )}
                            </Dialog>

                            {!isGuest && (
                              <DropdownMenu>
                                <DropdownMenuTrigger render={
                                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl shrink-0 border-border/50">
                                    <Share2 className="w-5 h-5" />
                                  </Button>
                                } />
                                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                                  <DropdownMenuItem onClick={() => shareToTwitter(niche)} className="rounded-xl py-2.5">
                                    <Twitter className="w-4 h-4 mr-3 text-sky-500" /> Twitter
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => shareToFacebook(niche)} className="rounded-xl py-2.5">
                                    <Facebook className="w-4 h-4 mr-3 text-blue-600" /> Facebook
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => shareToLinkedIn(niche)} className="rounded-xl py-2.5">
                                    <Linkedin className="w-4 h-4 mr-3 text-blue-700" /> LinkedIn
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            </div>
                            {niche.source && (
                              <div className="absolute bottom-1 right-3 text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter">
                                API: {niche.source}
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border/50 animate-in fade-in zoom-in duration-500">
                      <div className="bg-muted p-6 rounded-full mb-6">
                        <Search className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold">No niches found</h3>
                      <p className="text-muted-foreground text-center max-w-sm mt-3 px-6">
                        {selectedApiKey 
                          ? "We couldn't find any trending niches with your custom API key. Please verify your key is active and has billing enabled in the provider's console (Google AI Studio or Groq)."
                          : "We couldn't find any trending niches matching your criteria. Try adjusting your filters or refreshing."}
                      </p>
                      <Button variant="outline" className="mt-8 rounded-2xl px-8 h-12 font-bold" onClick={() => fetchGeneralNiches()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Trends
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'generator' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black tracking-tight">AI Generator</h1>
                      <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase tracking-widest">
                        BETA
                      </span>
                    </div>
                    <p className="text-muted-foreground">Create high-quality prompts for thumbnails and backgrounds.</p>
                  </div>

                  <Card className="bg-card/50 backdrop-blur-md border-border/50 rounded-3xl overflow-hidden shadow-2xl shadow-primary/5">
                    <CardContent className="p-6 md:p-10">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">What's your video about?</Label>
                          <div className="relative">
                            <Input 
                              placeholder="e.g. A dark academia library with floating candles..." 
                              className="h-16 rounded-2xl bg-background/50 border-border/50 text-lg px-6 focus-visible:ring-primary/20"
                              value={quickPromptInput}
                              onChange={(e) => setQuickPromptInput(e.target.value)}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Button 
                                size="icon"
                                className="h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20"
                                onClick={handleQuickPromptGenerate}
                                disabled={isGeneratingQuickPrompt}
                              >
                                {isGeneratingQuickPrompt ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {quickPromptResult && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-primary/5 rounded-2xl border border-primary/10 p-6 relative overflow-hidden group"
                          >
                            <div className="absolute top-0 right-0 p-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-lg text-xs font-bold"
                                onClick={() => {
                                  navigator.clipboard.writeText(quickPromptResult);
                                  toast.success('Copied!');
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Generated Visual Blueprint</h4>
                            <p className="text-lg leading-relaxed italic font-serif text-foreground/90">
                              {quickPromptResult}
                            </p>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                          {['Cinematic', 'Cyberpunk', 'Minimalist', 'Hyper-realistic'].map((style) => (
                            <Button 
                              key={style}
                              variant="outline" 
                              className="h-12 rounded-xl border-border/50 bg-background/30 hover:bg-primary/5 hover:border-primary/30 transition-all text-xs font-bold"
                              onClick={() => setQuickPromptInput(prev => prev ? `${prev}, ${style} style` : `${style} style`)}
                            >
                              {style}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'analytics' && (
                <AnalyticsTab niches={niches} savedScripts={savedScripts} />
              )}

              {activeTab === 'saved' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight">Saved Blueprints</h1>
                    <p className="text-muted-foreground">Your collection of viral scripts and ideas.</p>
                  </div>

                  {savedScripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border/50">
                      <div className="bg-muted p-4 rounded-full mb-4">
                        <Bookmark className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No scripts saved yet.</p>
                      <Button variant="link" onClick={() => handleTabChange('trends')} className="mt-2">
                        Browse trending niches
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {savedScripts.map((script) => (
                        <Card key={script.id} className="rounded-3xl border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                                {script.platform}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {script.createdAt?.toDate ? new Date(script.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">{script.niche}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed italic">
                              {script.content}
                            </p>
                          </CardContent>
                          <CardFooter className="gap-3">
                            <Button variant="outline" className="flex-grow rounded-xl h-10 text-xs font-bold" onClick={() => setActiveScript(script)}>
                              View Full Blueprint
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteScript(script.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and preferences.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Card className="rounded-3xl border-border/50 overflow-hidden">
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-xl">
                              <UserIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold">{user?.email}</p>
                              <p className="text-xs text-muted-foreground">Account Email</p>
                            </div>
                          </div>
                          <UserProfileDialog />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-xl">
                              <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold">AI Engine</p>
                              <p className="text-xs text-muted-foreground">Select your preferred AI model</p>
                            </div>
                          </div>
                          {userProfile?.settings?.customApis && userProfile.settings.customApis.length > 0 ? (
                            <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                              <SelectTrigger className="w-[140px] h-9 text-xs">
                                <SelectValue placeholder="Select Engine" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={undefined as any}>Default</SelectItem>
                                {userProfile.settings.customApis.map((api) => (
                                  <SelectItem key={api.id} value={api.apiKey} disabled={api.status === 'failed'}>
                                    {api.platform}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No custom APIs</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-xl">
                              <SettingsIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold">App Preferences</p>
                              <p className="text-xs text-muted-foreground">Theme, Notifications, etc.</p>
                            </div>
                          </div>
                          <SettingsDialog />
                        </div>

                        <div className="pt-4">
                          <Button variant="destructive" className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-destructive/20" onClick={logout}>
                            <LogOut className="w-5 h-5 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </main>
          </motion.div>
        </AnimatePresence>
      </div>
      )}

      {/* Bottom Navigation for Mobile/Tablet */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 px-6 py-3 z-30 flex items-center justify-between safe-area-bottom">
        {[
          { id: 'trends', icon: Home, label: 'Trends' },
          { id: 'generator', icon: Sparkles, label: 'AI Gen' },
          { id: 'analytics', icon: BarChart3, label: 'Stats' },
          ...(!isGuest ? [
            { id: 'saved', icon: Bookmark, label: 'Saved' },
            { id: 'settings', icon: SettingsIcon, label: 'Menu' },
          ] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              activeTab === tab.id ? 'text-primary scale-110 font-black' : 'text-muted-foreground font-bold'
            }`}
          >
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] uppercase tracking-tighter">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute -top-3 w-1 h-1 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>
    </motion.div>
  );
}
