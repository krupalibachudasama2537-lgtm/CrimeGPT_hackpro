import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); // Forces Node to use Google/Cloudflare DNS
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import User from './models/user.js';

// Import RAG Service Initialization
import { initializeRAG } from './services/ragService.js';
import { initializeOfflineDb } from './services/offlineStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __backendDir = path.dirname(__filename);
dotenv.config({ path: path.join(__backendDir, '.env') });

const app = express();
const server = http.createServer(app);

// Socket.io integration
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for the prototype
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Pass socket server to routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(cors());
app.use(express.json());

// Rate Limiting to prevent brute-force attacks and abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api/', apiLimiter);

// Serve static assets if in production (optional fallback)
if (process.env.NODE_ENV === 'production') {
  // Points to the folder we just copied the files into
  const buildPath = path.join(process.cwd(), 'frontend', 'dist');
  app.use(express.static(buildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Map API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/ai', aiRoutes);

// Simple Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Catch-all route to serve React frontend if in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 20px; background: #0b0f19; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; margin: -8px;">
        <div style="background: #111827; border: 1px solid #1f2937; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); max-width: 500px; width: 100%;">
          <h1 style="color: #c89f53; margin: 0 0 10px 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">CrimeGPT Backend</h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 25px 0;">API Server successfully connected and listening on port 5000.</p>
          <div style="border-top: 1px solid #1f2937; padding-top: 25px;">
            <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 15px 0;">To access the interactive CrimeGPT Portal, go to:</p>
            <a href="http://localhost:5173" style="color: #0b0f19; background: #c89f53; text-decoration: none; font-weight: 800; font-size: 15px; padding: 12px 24px; border-radius: 8px; display: inline-block; transition: all 0.2s; box-shadow: 0 4px 10px rgba(200, 159, 83, 0.2);">
              Open Frontend (http://localhost:5173)
            </a>
          </div>
        </div>
      </div>
    `);
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Socket.io Collaboration Logic
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Officer joins a specific case room
  socket.on('joinCase', (caseId) => {
    socket.join(caseId);
    console.log(`Socket ${socket.id} joined room for Case: ${caseId}`);
  });

  // Officer leaves a specific case room
  socket.on('leaveCase', (caseId) => {
    socket.leave(caseId);
    console.log(`Socket ${socket.id} left room for Case: ${caseId}`);
  });

  // Broadcast real-time typing indicators or field edits
  socket.on('fieldEdit', ({ caseId, officerName, field, value }) => {
    socket.to(caseId).emit('fieldEdited', {
      officerName,
      field,
      value
    });
  });

  // Broadcast custom activities or notifications
  socket.on('notify', ({ caseId, message, type }) => {
    socket.to(caseId).emit('notificationReceived', {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crimegpt';

async function startServer() {
  // Initialize RAG database and cache
  try {
    await initializeRAG();
  } catch (ragError) {
    console.error('Failed to initialize RAG pipeline:', ragError);
  }

  // Initialize local JSON offline DB files
  try {
    await initializeOfflineDb();
  } catch (offlineError) {
    console.error('Failed to initialize offline database:', offlineError);
  }
  
  server.listen(PORT, () => {
    console.log(`CrimeGPT Backend Server running on port ${PORT}`);
    console.log(`➜  Local:   http://localhost:${PORT}/`);
  });
}

async function seedMongoUsers() {
  try {
    const demoUserExists = await User.findOne({ username: "IO-9982" });
    if (!demoUserExists) {
      console.log('MongoDB Demo users missing. Seeding demo users...');
      const seedUsers = [
        {
          _id: "65e8a156e9c60e3cc4a12301",
          username: "IO-9982",
          name: "Inspector Rajesh V. Parmar",
          email: "rajesh.parmar@police.gov.in",
          badge: "IO-9982",
          password: "password123",
          role: "io"
        },
        {
          _id: "65e8a156e9c60e3cc4a12302",
          username: "SHO-8891",
          name: "Senior Inspector M. K. Jadeja",
          email: "mk.jadeja@police.gov.in",
          badge: "SHO-8891",
          password: "password123",
          role: "sho"
        },
        {
          _id: "65e8a156e9c60e3cc4a12303",
          username: "LA-1102",
          name: "Advocate P. D. Vyas",
          email: "pd.vyas@legal.gov.in",
          badge: "LA-1102",
          password: "password123",
          role: "legal"
        }
      ];
      for (const u of seedUsers) {
        const newUser = new User(u);
        await newUser.save();
      }
      console.log('Successfully seeded MongoDB demo users.');
    }
  } catch (err) {
    console.error('Failed to seed MongoDB demo users:', err);
  }
}

// Ensure MONGODB_URI is loaded from process.env
const dbURI = process.env.MONGODB_URI;

console.log("Attempting to connect to:", dbURI); // Add this for debugging in your terminal

mongoose.connect(dbURI, { 
    serverSelectionTimeoutMS: 5000 // Increased timeout for Atlas cloud connections
})
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    await seedMongoUsers();
    await startServer();
  })
  .catch(async (err) => {
    console.warn('WARNING: MongoDB connection failed!');
    console.error('Error:', err.message);
    await startServer(); // Start in offline mode
  });
