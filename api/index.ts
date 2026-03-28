import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Instagram OAuth Routes
app.get("/api/auth/instagram/url", (req, res) => {
  const redirectUri = req.query.redirectUri as string || (process.env.APP_URL ? `${process.env.APP_URL}/api/auth/instagram/callback` : `${req.protocol}://${req.get("host")}/api/auth/instagram/callback`);
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).json({ error: "Instagram Client ID not configured. Please add INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET to your secrets." });
  }

  // Using Instagram Basic Display API
  const stateObj = {
    uid: req.query.uid as string || "default_state",
    redirectUri
  };

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "user_profile,user_media",
    response_type: "code",
    state: Buffer.from(JSON.stringify(stateObj)).toString('base64'),
  });

  const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get("/api/auth/instagram/callback", async (req, res) => {
  const { code, state, error, error_reason, error_description } = req.query;
  
  let uid = "default_state";
  let redirectUri = process.env.APP_URL ? `${process.env.APP_URL}/api/auth/instagram/callback` : `${req.protocol}://${req.get("host")}/api/auth/instagram/callback`;
  
  try {
    if (state && typeof state === 'string') {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decodedState.uid) uid = decodedState.uid;
      if (decodedState.redirectUri) redirectUri = decodedState.redirectUri;
    }
  } catch (e) {
    // Fallback if state is not base64 JSON
    uid = state as string || "default_state";
  }

  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error_description || error}' }, '*');
              window.close();
            }
          </script>
          <p>Authentication failed or was declined. You can close this window.</p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    // Exchange code for short-lived access token
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID || "",
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET || "",
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code as string,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error_message) {
      throw new Error(tokenData.error_message);
    }

    // We have the access token and user ID.
    // In a real app, we'd exchange this for a long-lived token and store it securely in Firestore
    // associated with the user's UID (passed in 'state').
    // For this demo, we'll pass it back to the client to use immediately.
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                token: '${tokenData.access_token}',
                userId: '${tokenData.user_id}',
                uid: '${uid}'
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error exchanging code for token:", err);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Failed to exchange token' }, '*');
              window.close();
            }
          </script>
          <p>Authentication failed. You can close this window.</p>
        </body>
      </html>
    `);
  }
});

// Fetch Instagram Media
app.post("/api/instagram/media", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "No token provided" });

  try {
    // Fetch user's media
    const mediaResponse = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${token}`);
    const mediaData = await mediaResponse.json();

    if (mediaData.error) {
      throw new Error(mediaData.error.message);
    }

    res.json({ media: mediaData.data });
  } catch (err: any) {
    console.error("Error fetching Instagram media:", err);
    res.status(500).json({ error: err.message || "Failed to fetch media" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Start server if not running in Vercel
if (!process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  // In Vercel, we don't need to call setupVite() for static files
  // but we still need the API routes to work.
  // Vercel will handle the static files from 'dist' if configured in vercel.json
}

export default app;
