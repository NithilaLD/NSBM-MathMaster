import express from "express";
import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuestionSchema, insertQuizAnswerSchema, insertResultSchema, loginSchema, type User } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { ParamsDictionary } from "express-serve-static-core";

// Extend Express Request type
interface Request extends ExpressRequest {
  session: session.Session & {
    user?: Omit<User, 'password'>;
  };
  body: any;
  params: ParamsDictionary;
  file?: Express.Multer.File;
}

// Extend Express Response type
interface Response extends ExpressResponse {
  json: (body: any) => Response;
  status: (code: number) => Response;
}

// Create an express router
const router = express.Router();

// Create session store
const MemoryStoreSession = MemoryStore(session);

// Multer setup for file uploads
const uploadStorage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: uploadStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: ReturnType<typeof express>): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', express.static('uploads'));

  // Add default student user if it doesn't exist
  const defaultUser = {
    username: "student",
    password: "student",
    role: "student" as const,
    school: "Other" as const
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
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user || (req.session.user.role !== "admin" && req.session.user.role !== "superadmin")) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  };

  const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user || req.session.user.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden: Super Admin access required" });
    }
    next();
  };

  // Use the router for routes
  app.use(router);

  // Mount routes on the router instead of app
  router.post("/api/auth/login", async (req: Request, res: Response) => {
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

  // Continue with other routes using router instead of app
  router.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err: Error) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  router.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: req.session.user });
  });

  // User routes
  router.get("/api/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  router.post("/api/users", requireSuperAdmin, async (req: Request, res: Response) => {
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

  router.put("/api/users/:id", requireSuperAdmin, async (req: Request, res: Response) => {
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

  router.delete("/api/users/:id", requireSuperAdmin, async (req: Request, res: Response) => {
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
  router.get("/api/questions", async (req: Request, res: Response) => {
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

  router.post("/api/questions", requireAdmin, upload.single('questionImage'), async (req: Request, res: Response) => {
    try {
      const questionData = {
        questionText: req.body.questionText || '',
        questionImage: req.file ? req.file.filename : null,
        optionA: req.body.optionA,
        optionB: req.body.optionB,
        optionC: req.body.optionC,
        optionD: req.body.optionD,
        correctAnswer: req.body.correctAnswer,
        difficulty: req.body.difficulty || 'medium',
        createdBy: req.session.user?.id,
        isImage: req.file ? true : false
      };

      // Validate the data
      const parsedData = insertQuestionSchema.parse(questionData);
      
      // Additional validation for image questions
      if (questionData.isImage && !questionData.questionImage) {
        throw new Error("Image is required for image-based questions");
      }

      // Make sure correct answer is one of the options
      if (!['A', 'B', 'C', 'D'].includes(questionData.correctAnswer)) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        throw new Error("Invalid correct answer selected");
      }

      const newQuestion = await storage.createQuestion(parsedData);
      res.status(201).json(newQuestion);
    } catch (error: any) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error?.message || "Failed to create question" });
    }
  });

  router.put("/api/questions/:id", requireAdmin, upload.single('questionImage'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      
      if (!question) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "Question not found" });
      }

      const questionData = {
        questionText: req.body.questionText || '',
        questionImage: req.file ? req.file.filename : question.questionImage,
        optionA: req.body.optionA || question.optionA,
        optionB: req.body.optionB || question.optionB,
        optionC: req.body.optionC || question.optionC,
        optionD: req.body.optionD || question.optionD,
        correctAnswer: req.body.correctAnswer || question.correctAnswer,
        difficulty: req.body.difficulty || question.difficulty,
        isImage: req.file ? true : question.isImage
      };

      // Validate the data
      const parsedData = insertQuestionSchema.partial().parse(questionData);
      
      // Additional validation for image questions
      if (questionData.isImage && !questionData.questionImage) {
        throw new Error("Image is required for image-based questions");
      }

      // Make sure correct answer is one of the options
      if (!['A', 'B', 'C', 'D'].includes(questionData.correctAnswer)) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        throw new Error("Invalid correct answer selected");
      }

      // Delete old image if new one is uploaded
      if (req.file && question.questionImage) {
        const oldImagePath = path.join('./uploads', question.questionImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const updatedQuestion = await storage.updateQuestion(id, parsedData);
      res.json(updatedQuestion);
    } catch (error: any) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error?.message || "Failed to update question" });
    }
  });

  router.delete("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
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
  router.get("/api/quiz/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getQuizSettings();
      res.json(settings || { state: "waiting" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz settings" });
    }
  });

  router.post("/api/quiz/start", requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.startQuiz();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });

  router.post("/api/quiz/reset", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.resetQuiz();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to reset quiz" });
    }
  });

  // Quiz answers routes
  router.post("/api/quiz/answers", requireAuth, async (req: Request, res: Response) => {
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

  router.get("/api/quiz/answers", requireAuth, async (req: Request, res: Response) => {
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
  router.post("/api/results", requireAuth, async (req: Request, res: Response) => {
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

  router.get("/api/results", requireAuth, async (req: Request, res: Response) => {
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

  router.get("/api/results/me", requireAuth, async (req: Request, res: Response) => {
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