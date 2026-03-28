import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, TrendingUp, Sparkles, Instagram, Youtube, Code, User, Heart, Zap, Shield, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const About = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors duration-300">
              ViralTracker
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants} className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Elevate Your Content Strategy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ViralTracker is an AI-powered engine designed to help creators identify trending niches, generate viral scripts, and dominate social media platforms.
            </p>
          </motion.section>

          {/* What the App Does */}
          <motion.section variants={itemVariants} className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold tracking-tight">What ViralTracker Does</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                <CardHeader>
                  <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
                  <CardTitle>Niche Discovery</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  We analyze global trends across Instagram Reels and YouTube Shorts to find high-growth niches before they become saturated.
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Sparkles className="w-8 h-8 text-yellow-500 mb-2" />
                  <CardTitle>AI Script Generation</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Our advanced AI models generate high-retention scripts optimized for viral hooks, engagement, and conversion.
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Instagram className="w-8 h-8 text-pink-500 mb-2" />
                  <CardTitle>Personalized Insights</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  By connecting your Instagram account, we provide tailored recommendations based on your existing content style and audience.
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Globe className="w-8 h-8 text-green-500 mb-2" />
                  <CardTitle>Global Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Real-time data fetching from multiple APIs ensures you stay ahead of the curve with the latest viral patterns.
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                <CardHeader>
                  <User className="w-8 h-8 text-purple-500 mb-2" />
                  <CardTitle>Guest Access</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Try out our core features without signing in. Explore trending niches and generate scripts instantly as a guest.
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* About the Creator */}
          <motion.section variants={itemVariants} className="bg-muted/30 rounded-3xl p-8 sm:p-12 border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-1 shadow-2xl shadow-primary/20">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <Code className="w-12 h-12 text-primary opacity-20 absolute -top-2 -left-2 rotate-12" />
                        <span className="text-4xl font-black tracking-tighter bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent relative z-10">
                          NR
                        </span>
                        <Zap className="w-6 h-6 text-yellow-500 absolute -bottom-1 -right-1 fill-yellow-500 animate-pulse" />
                      </div>
                      <div className="h-1 w-8 bg-primary/20 rounded-full mt-1" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-left space-y-4">
                <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-2">
                  The Creator
                </div>
                <h2 className="text-3xl font-black tracking-tight">Hi, I'm Neel</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  I'm a passionate developer and content strategist dedicated to building tools that empower creators. ViralTracker was born out of the need for a more data-driven approach to short-form video creation.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Code className="w-4 h-4 text-primary" /> Full-Stack Dev
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Zap className="w-4 h-4 text-yellow-500" /> AI Enthusiast
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-500" /> Security Focused
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <a 
                    href="https://instagram.com/neel_rj104" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-pink-500/10 text-pink-500 rounded-xl hover:bg-pink-500 hover:text-white transition-all shadow-lg shadow-pink-500/10"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://youtube.com/@neelrj" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://github.com/neelrj" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-primary-foreground transition-all shadow-lg shadow-primary/10"
                  >
                    <Code className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://neelrj.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Mission */}
          <motion.section variants={itemVariants} className="text-center space-y-8 py-12">
            <div className="max-w-2xl mx-auto space-y-4">
              <Heart className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
              <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
              <p className="text-muted-foreground text-lg italic">
                "To democratize viral success by providing every creator with the AI tools and data insights they need to grow their influence and impact."
              </p>
            </div>
          </motion.section>

          {/* Footer */}
          <motion.footer variants={itemVariants} className="pt-12 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 ViralTracker. Built with passion by Neel.</p>
          </motion.footer>
        </motion.div>
      </main>
    </div>
  );
};

export default About;
