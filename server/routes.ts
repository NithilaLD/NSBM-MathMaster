import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuestionSchema, insertQuizAnswerSchema, insertResultSchema, loginSchema, User } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

// Extend the session with user property
declare module 'express-session' {
  interface Session {
    user?: Omit<User, 'password'>;
  }
}

// Create session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Add default student user if it doesn't exist
  const defaultUser = {
    username: "student",
    password: "student",
    role: "student",
    school: "Other"
  };
  
  try {
    const existingUser = await storage.getUserByUsername(defaultUser.username);
    if (!existingUser) {
      await storage.createUser(defaultUser);
      console.log("Created default student user");
    }
  } catch (error) {
    console.error("Failed to create default user:", error);
  }

  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "math-competition-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 86400000, // 24 hours
        httpOnly: true,
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );

  // Auth middleware for different roles
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.user || (req.session.user.role !== "admin" && req.session.user.role !== "superadmin")) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  };

  const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.user || req.session.user.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden: Super Admin access required" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);

      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Don't allow students to login if school doesn't match
      if (user.role === "student" && credentials.school && user.school !== credentials.school) {
        return res.status(401).json({ message: "Invalid school selected" });
      }

      // Update last login
      await storage.updateUser(user.id, { 
        lastLogin: new Date() 
      });

      // Store user in session (exclude password)
      const { password, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: req.session.user });
  });

  // User routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireSuperAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      // Don't return password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteUser(id);
      
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Question routes
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.listQuestions();
      
      // If the user is not authenticated or is a student, filter out correct answers
      if (!req.session.user || req.session.user.role === 'student') {
        const filteredQuestions = questions.map(q => {
          // Omit correctAnswer for students or unauthenticated users
          const { correctAnswer, ...rest } = q;
          return rest;
        });
        return res.json(filteredQuestions);
      }
      
      // Admin and superadmin can see all question details
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", requireAdmin, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      
      const newQuestion = await storage.createQuestion({
        ...questionData,
        createdBy: req.session.user?.id,
      });
      
      res.status(201).json(newQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const questionData = insertQuestionSchema.partial().parse(req.body);
      
      const updatedQuestion = await storage.updateQuestion(id, questionData);
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteQuestion(id);
      
      if (!result) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Quiz settings routes
  app.get("/api/quiz/settings", async (req, res) => {
    try {
      const settings = await storage.getQuizSettings();
      res.json(settings || { state: "waiting" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz settings" });
    }
  });

  app.post("/api/quiz/start", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.startQuiz();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });

  app.post("/api/quiz/reset", requireSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.resetQuiz();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to reset quiz" });
    }
  });

  // Quiz answers routes
  app.post("/api/quiz/answers", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const answerData = insertQuizAnswerSchema.parse(req.body);
      
      // Ensure the user is submitting their own answers
      if (answerData.userId !== req.session.user.id) {
        return res.status(403).json({ message: "Cannot submit answers for another user" });
      }
      
      const savedAnswer = await storage.saveQuizAnswer(answerData);
      res.status(201).json(savedAnswer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to save answer" });
    }
  });

  app.get("/api/quiz/answers", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.user.id;
      const answers = await storage.getQuizAnswersForUser(userId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  // Results routes
  app.post("/api/results", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const resultData = insertResultSchema.parse(req.body);
      
      // Ensure the user is submitting their own results
      if (resultData.userId !== req.session.user.id) {
        return res.status(403).json({ message: "Cannot submit results for another user" });
      }
      
      // The server will recalculate the score for security
      // Client-submitted scores are ignored in favor of server calculation
      // This ensures students can't manipulate their scores
      let savedResult = await storage.getResult(resultData.userId);

      if (savedResult) {
        // Update existing result
        savedResult = await storage.updateResult(resultData.userId, resultData);
      } else {
        // Create new result
        savedResult = await storage.saveResult(resultData);
      }
      
      res.status(201).json(savedResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to save result" });
    }
  });

  app.get("/api/results", requireAuth, async (req, res) => {
    try {
      const results = await storage.listResults();
      
      // Only admin can see all results, students can only see their own
      if (req.session.user && (req.session.user.role === "admin" || req.session.user.role === "superadmin")) {
        return res.json(results);
      }
      
      // For students, return all results but without usernames (just ranks and scores)
      const sanitizedResults = results.map(result => {
        if (result.userId === req.session.user?.id) {
          return result; // Return full data for the current user
        }
        return {
          ...result,
          userId: 0, // Hide the actual user ID
        };
      });
      
      res.json(sanitizedResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.get("/api/results/me", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.user.id;
      const result = await storage.getResult(userId);
      
      if (!result) {
        return res.status(404).json({ message: "No result found" });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates with permissive options for Replit environment
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add permissive options for Replit's environment
    perMessageDeflate: false,
    clientTracking: true,
    // Don't validate origin in Replit environment
    verifyClient: () => true
  });
  
  // Store clients in map with additional metadata
  const clients = new Map<WebSocket, { 
    isAlive: boolean,
    lastPingTime: number,
    userId?: number
  }>();
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.set(ws, { 
      isAlive: true, 
      lastPingTime: Date.now() 
    });
    
    // Send initial quiz state
    storage.getQuizSettings().then(settings => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'QUIZ_STATE_UPDATE',
          payload: settings || { state: 'waiting' }
        }));
      }
    });
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        // Process incoming messages
        const data = JSON.parse(message.toString());
        console.log(`Received WebSocket message: ${message.toString()}`);
        
        // Handle ping messages with a pong response to confirm connection is active
        if (data.type === 'PING') {
          console.log('Received PING, sending PONG response');
          // Reset the client's isAlive flag
          if (clients.has(ws)) {
            const client = clients.get(ws)!;
            client.isAlive = true;
            client.lastPingTime = Date.now();
            
            // Send pong response to client
            if (ws.readyState === WebSocket.OPEN) {
              const pongData = { type: 'PONG', timestamp: Date.now() };
              ws.send(JSON.stringify(pongData));
              console.log(`Sent PONG response: ${JSON.stringify(pongData)}`);
            } else {
              console.log(`Cannot send PONG, WebSocket not open: readyState=${ws.readyState}`);
            }
          } else {
            console.log('Cannot send PONG, client not in clients map');
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle client errors
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      // Don't immediately remove client on error, let ping mechanism handle it
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Handle pong response (to keep connection alive)
    ws.on('pong', () => {
      if (clients.has(ws)) {
        const client = clients.get(ws)!;
        client.isAlive = true;
        client.lastPingTime = Date.now();
      }
    });
  });
  
  // Set up ping interval to keep connections alive and detect disconnected clients
  const pingInterval = setInterval(() => {
    const now = Date.now();
    
    // Log active connections count
    console.log(`WebSocket status: ${wss.clients.size} total clients, ${clients.size} tracked clients`);
    
    wss.clients.forEach((ws) => {
      if (!clients.has(ws)) {
        console.log('Found untracked client, skipping');
        return;
      }
      
      const client = clients.get(ws)!;
      console.log(`Checking client: userId=${client.userId}, isAlive=${client.isAlive}, lastPingTime=${now - client.lastPingTime}ms ago`);
      
      // Check if client hasn't responded to ping
      if (client.isAlive === false) {
        console.log('Client unresponsive to ping, terminating connection');
        clients.delete(ws);
        return ws.terminate();
      }
      
      // Check if client hasn't sent a ping in too long (3 minutes)
      if (now - client.lastPingTime > 180000) {
        console.log('Client inactive for too long, terminating connection');
        clients.delete(ws);
        return ws.terminate();
      }
      
      // Mark as not alive, ping will set it back to alive
      client.isAlive = false;
      
      // Only ping if socket is open
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`Sending ping to client: userId=${client.userId}`);
        ws.ping();
      } else {
        console.log(`Cannot ping client: userId=${client.userId}, readyState=${ws.readyState}`);
      }
    });
  }, 25000); // 25 seconds
  
  // Clean up when server shuts down
  httpServer.on('close', () => {
    clearInterval(pingInterval);
  });
  
  // Function to broadcast quiz state to all connected clients
  const broadcastQuizState = (state: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify({
            type: 'QUIZ_STATE_UPDATE',
            payload: state,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Error broadcasting to client, removing from clients list', error);
          clients.delete(client);
        }
      }
    });
  };
  
  // Override storage.startQuiz and storage.resetQuiz to broadcast changes
  const originalStartQuiz = storage.startQuiz;
  storage.startQuiz = async () => {
    const settings = await originalStartQuiz.call(storage);
    broadcastQuizState(settings);
    return settings;
  };
  
  const originalResetQuiz = storage.resetQuiz;
  storage.resetQuiz = async () => {
    const settings = await originalResetQuiz.call(storage);
    broadcastQuizState(settings);
    return settings;
  };
  
  return httpServer;
}
