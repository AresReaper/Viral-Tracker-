import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTrendingNiches, getPersonalizedNiches, generateViralScript, TrendingNiche, ViralScript } from '../services/ai';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Loader2, TrendingUp, Instagram, Youtube, Sparkles, LogOut, FileText, Hash, Wrench, Scissors, Filter, ArrowUpDown, PlayCircle, ExternalLink, Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [niches, setNiches] = useState<TrendingNiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeScript, setActiveScript] = useState<ViralScript | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score-desc');
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
      const personalizedNiches = await getPersonalizedNiches(media);
      
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
      const data = await getTrendingNiches();
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
  }, [user, isInstagramConnected]);

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
      const script = await generateViralScript(niche.name, niche.platform);
      setActiveScript(script);
      
      // Save to Firestore
      if (user) {
        await addDoc(collection(db, 'scripts'), {
          ...script,
          authorId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast.success('Script generated and saved!');
      }
    } catch (error) {
      toast.error('Failed to generate script');
    } finally {
      setGenerating(null);
    }
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
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <header className="bg-card border-b border-border sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">ViralTracker</span>
          </div>
          <div className="flex items-center space-x-4">
            {isInstagramConnected ? (
              <span className="text-sm text-primary flex items-center bg-primary/10 px-2 py-1 rounded-md font-medium">
                <Instagram className="w-4 h-4 mr-1.5" />
                Connected
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowIgDialog(true)}>
                <Instagram className="w-4 h-4 mr-2" />
                Connect IG
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{user?.email}</span>
            
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 dracula:-rotate-90 dracula:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dracula:rotate-0 dracula:scale-0" />
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
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <Dialog open={showIgDialog} onOpenChange={setShowIgDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                Connect Instagram
              </DialogTitle>
              <DialogDescription>
                Connect your Instagram account to let our AI analyze your recent posts and find highly personalized trending niches that fit your exact style.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="outline" onClick={handleDeclineInstagram}>
                Skip for now
              </Button>
              <Button onClick={handleConnectInstagram} disabled={connectingIg}>
                {connectingIg ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Instagram className="w-4 h-4 mr-2" />}
                Connect Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Trending Niches</h1>
            <p className="text-muted-foreground">Discover what's going viral right now and generate scripts to ride the wave.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-neutral-500" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score-desc">Highest Score First</SelectItem>
                  <SelectItem value="score-asc">Lowest Score First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            <p className="text-neutral-500 animate-pulse">Analyzing current trends across platforms...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedNiches.map((niche) => (
              <Card key={niche.id} className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow bg-card text-card-foreground">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex space-x-1">
                      {(niche.platform === 'instagram' || niche.platform === 'both') && (
                        <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 p-1.5 rounded-md">
                          <Instagram className="w-4 h-4" />
                        </span>
                      )}
                      {(niche.platform === 'youtube' || niche.platform === 'both') && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-1.5 rounded-md">
                          <Youtube className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {niche.trendScore}/100
                    </div>
                  </div>
                  <CardTitle className="text-xl">{niche.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{niche.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger 
                        render={
                          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground cursor-help line-clamp-3" />
                        }
                      >
                        <span className="font-semibold text-foreground block mb-1">Why it's trending:</span>
                        {niche.reason}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3">
                        <p className="text-sm">{niche.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {niche.examples && niche.examples.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-semibold text-sm text-foreground flex items-center">
                        <PlayCircle className="w-4 h-4 mr-1.5 text-muted-foreground" />
                        Viral Examples
                      </span>
                      <div className="space-y-2">
                        {niche.examples.map((example, idx) => (
                          <a 
                            key={idx} 
                            href={example.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-2 rounded-md border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {example.title}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {example.description}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger 
                      render={
                        <Button 
                          className="w-full" 
                          onClick={() => handleGenerateScript(niche)}
                          disabled={generating === niche.id}
                        />
                      }
                    >
                      {generating === niche.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Crafting Script...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Viral Script
                        </>
                      )}
                    </DialogTrigger>
                    {activeScript && generating !== niche.id && (
                      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="text-2xl flex items-center">
                            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                            Viral Blueprint: {activeScript.niche}
                          </DialogTitle>
                          <DialogDescription>
                            Your complete guide to creating a viral {activeScript.platform} video.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Tabs defaultValue="script" className="flex-grow flex flex-col overflow-hidden mt-4">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="script"><FileText className="w-4 h-4 mr-2"/> Script</TabsTrigger>
                            <TabsTrigger value="tags"><Hash className="w-4 h-4 mr-2"/> Tags</TabsTrigger>
                            <TabsTrigger value="tools"><Wrench className="w-4 h-4 mr-2"/> Tools</TabsTrigger>
                            <TabsTrigger value="watermark"><Scissors className="w-4 h-4 mr-2"/> Watermarks</TabsTrigger>
                          </TabsList>
                          
                          <div className="flex-grow overflow-hidden mt-4 border rounded-md">
                            <ScrollArea className="h-[400px] p-4">
                              <TabsContent value="script" className="m-0">
                                <div className="prose prose-sm max-w-none">
                                  <h3 className="text-lg font-semibold mb-2">Video Script</h3>
                                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg border border-border font-mono text-sm">
                                    {activeScript.content}
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="tags" className="m-0">
                                <h3 className="text-lg font-semibold mb-4">Viral Tags & Hashtags</h3>
                                <div className="flex flex-wrap gap-2">
                                  {activeScript.tags.map((tag, i) => (
                                    <span key={i} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-sm font-medium">
                                      {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-6">
                                  Tip: Mix broad tags with highly specific niche tags. Add these to your caption and first comment.
                                </p>
                              </TabsContent>
                              
                              <TabsContent value="tools" className="m-0">
                                <h3 className="text-lg font-semibold mb-4">Free Creation Tools</h3>
                                <ul className="space-y-3">
                                  {activeScript.tools.map((tool, i) => (
                                    <li key={i} className="flex items-start">
                                      <div className="bg-muted p-2 rounded-md mr-3">
                                        <Wrench className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                      <span className="pt-1">{tool}</span>
                                    </li>
                                  ))}
                                </ul>
                              </TabsContent>

                              <TabsContent value="watermark" className="m-0">
                                <h3 className="text-lg font-semibold mb-4">Watermark Removal Guide</h3>
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                                  <div className="flex items-start">
                                    <Scissors className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                                    <div className="whitespace-pre-wrap text-amber-600 dark:text-amber-400 text-sm">
                                      {activeScript.watermarkTips}
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            </ScrollArea>
                          </div>
                        </Tabs>
                      </DialogContent>
                    )}
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
