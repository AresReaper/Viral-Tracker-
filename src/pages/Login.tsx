import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, Youtube, Instagram } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, isGuest, signInWithGoogle, loginAsGuest } = useAuth();

  if (user || isGuest) {
    return <Navigate to="/" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-neutral-50 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md border-neutral-200 shadow-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-neutral-900 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Viral Niche Tracker</CardTitle>
          <CardDescription>
            Discover trending niches and generate viral scripts for Instagram and YouTube.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium"
            onClick={signInWithGoogle}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <Button 
            variant="ghost" 
            className="w-full h-12 text-base font-medium text-neutral-600 hover:text-neutral-900"
            onClick={loginAsGuest}
          >
            Continue as Guest
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">Or connect</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full" disabled>
              <Instagram className="w-4 h-4 mr-2" />
              Instagram
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <Youtube className="w-4 h-4 mr-2" />
              YouTube
            </Button>
          </div>
          <p className="text-xs text-center text-neutral-500 mt-4">
            Instagram and YouTube direct login coming soon. Please use Google to sign in for now.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
