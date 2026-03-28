import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingNiche } from '../services/ai';
import { 
  BarChart3, 
  Activity, 
  Zap, 
  Target, 
  Hash, 
  TrendingUp, 
  Users, 
  Eye, 
  Share2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Instagram,
  Youtube
} from 'lucide-react';
import { Progress } from './ui/progress';

interface AnalyticsTabProps {
  niches: TrendingNiche[];
  savedScripts: any[];
}

export function AnalyticsTab({ niches, savedScripts }: AnalyticsTabProps) {
  const [realtimeData, setRealtimeData] = useState<number[]>([]);
  
  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealtimeData(prev => {
        const newData = [...prev, Math.floor(Math.random() * 60) + 20];
        if (newData.length > 12) return newData.slice(1);
        return newData;
      });
    }, 3000);
    
    // Initial data
    setRealtimeData(Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 20));
    
    return () => clearInterval(interval);
  }, []);

  const topNiches = niches.slice(0, 4);
  const recentLogs = [
    { time: '12:04:21', method: 'GET', path: '/v1/trends', status: 200, latency: '2ms' },
    { time: '12:04:22', method: 'POST', path: '/v1/generate', status: 200, latency: '48ms' },
    { time: '12:04:23', method: 'POST', path: '/v1/analyze', status: 200, latency: '12ms' },
    { time: '12:04:24', method: 'PUT', path: '/v1/settings', status: 200, latency: '5ms' },
    { time: '12:04:25', method: 'GET', path: '/v1/health', status: 200, latency: '1ms' },
    { time: '12:04:26', method: 'DEL', path: '/v1/cache', status: 204, latency: '3ms' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Viral Analytics</h1>
        <p className="text-muted-foreground">Monitor niche performance, reach velocity, and hashtag efficiency.</p>
      </div>

      {/* Top Row: Real-time & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Real-time Reach Velocity
            </CardTitle>
            <p className="text-xs text-muted-foreground">Monitor aggregate impression throughput across all active niches.</p>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] flex items-end gap-1.5 pt-4">
              {realtimeData.map((val, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-md relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {val}k/s
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Generation Logs
            </CardTitle>
            <p className="text-xs text-muted-foreground">Full trace of AI generation requests and API latency.</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentLogs.map((log, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground">{log.time}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      log.method === 'GET' ? "bg-blue-500/10 text-blue-500" :
                      log.method === 'POST' ? "bg-green-500/10 text-green-500" :
                      log.method === 'PUT' ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-red-500/10 text-red-500"
                    )}>
                      {log.method}
                    </span>
                    <span className="text-[11px] font-mono truncate max-w-[100px]">{log.path}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-green-500">{log.status}</span>
                    <span className="text-[10px] text-muted-foreground">{log.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Health, Optimization, Topology */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Niche Health
            </CardTitle>
            <p className="text-xs text-muted-foreground">Track engagement and model health.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {topNiches.map((niche, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs font-medium truncate max-w-[120px]">{niche.name}</span>
                <span className={cn(
                  "text-xs font-bold",
                  niche.trendScore > 90 ? "text-green-500" : "text-yellow-500"
                )}>
                  {niche.trendScore}%
                </span>
              </div>
            ))}
            {topNiches.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No niches analyzed yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Reach Optimization
            </CardTitle>
            <p className="text-xs text-muted-foreground">Maximize viral potential automatically.</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>Hook Retention</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-1.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>Share Velocity</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-1.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>Algorithm Favor</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              Hashtag Topology
            </CardTitle>
            <p className="text-xs text-muted-foreground">Visualize tag efficiency in real time.</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-full transition-all duration-500",
                    i % 3 === 0 ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : 
                    i % 5 === 0 ? "bg-primary/60" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Viral Intelligence
            </CardTitle>
            <p className="text-xs text-muted-foreground">Granular reach breakdown per niche.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 flex flex-col items-center">
                <span className="text-lg font-black">$2.4</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Cost/1k Reach</span>
              </div>
              <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 flex flex-col items-center">
                <span className="text-lg font-black">847</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Reach/Sec</span>
              </div>
              <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 flex flex-col items-center">
                <span className="text-lg font-black">34%</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">% Viral Growth</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Niche Comparison Table */}
      <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Niche Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Niche</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Platform</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reach</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Engagement</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Hashtags</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {niches.slice(0, 5).map((niche, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{niche.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{niche.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {niche.platform === 'instagram' || niche.platform === 'both' ? <Instagram className="w-3 h-3 text-pink-500" /> : null}
                        {niche.platform === 'youtube' || niche.platform === 'both' ? <Youtube className="w-3 h-3 text-red-500" /> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-mono">{(Math.random() * 500 + 100).toFixed(1)}k</span>
                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono">{(Math.random() * 10 + 2).toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {['viral', niche.name.toLowerCase().split(' ')[0], 'trending'].map((tag, j) => (
                          <span key={j} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase">Active</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {niches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">
                      No niche data available for analysis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
