import { users, questions, quizSettings, quizAnswers, results, type User, type InsertUser, type Question, type InsertQuestion, type QuizSetting, type InsertQuizSetting, type QuizAnswer, type InsertQuizAnswer, type Result, type InsertResult } from "@shared/schema";

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser> & { lastLogin?: Date }): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  
  // Question management
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  listQuestions(): Promise<Question[]>;
  
  // Quiz settings
  getQuizSettings(): Promise<QuizSetting | undefined>;
  createOrUpdateQuizSettings(settings: Partial<InsertQuizSetting>): Promise<QuizSetting>;
  startQuiz(): Promise<QuizSetting>;
  resetQuiz(): Promise<QuizSetting>;
  
  // Quiz answers
  saveQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  getQuizAnswersForUser(userId: number): Promise<QuizAnswer[]>;
  
  // Results
  getResult(userId: number): Promise<Result | undefined>;
  saveResult(result: InsertResult): Promise<Result>;
  listResults(): Promise<Result[]>;
  calculateRankings(): Promise<void>;
  calculateScore(userId: number): Promise<{
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedAnswers: number;
    averageResponseTime: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private quizSettings: QuizSetting | undefined;
  private quizAnswers: Map<number, QuizAnswer>;
  private results: Map<number, Result>;
  
  private userIdCounter: number;
  private questionIdCounter: number;
  private quizAnswerIdCounter: number;
  private resultIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.quizAnswers = new Map();
    this.results = new Map();
    
    this.userIdCounter = 1;
    this.questionIdCounter = 1;
    this.quizAnswerIdCounter = 1;
    this.resultIdCounter = 1;
    
    // Create default quiz settings
    this.quizSettings = {
      id: 1,
      state: 'waiting',
      startTime: null,
      endTime: null,
      lastReset: null,
      updatedAt: new Date(),
    };
    
    // Create default admin and superadmin accounts
    this.createUser({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    });
    
    this.createUser({
      username: 'superadmin',
      password: 'superadmin123',
      role: 'superadmin',
    });
    
    // Add sample math questions for testing
    this.createQuestion({
      questionText: "What is the value of x in the equation 2x + 5 = 13?",
      optionA: "3",
      optionB: "4",
      optionC: "5",
      optionD: "6",
      correctAnswer: "B",
      difficulty: "easy"
    });
    
    this.createQuestion({
      questionText: "Find the area of a circle with radius 5 cm. (Use π = 3.14)",
      optionA: "15.7 cm²",
      optionB: "31.4 cm²",
      optionC: "78.5 cm²",
      optionD: "153.86 cm²",
      correctAnswer: "C",
      difficulty: "medium"
    });
    
    this.createQuestion({
      questionText: "If sin(θ) = 0.5, what is θ?",
      optionA: "30°",
      optionB: "45°",
      optionC: "60°",
      optionD: "90°",
      correctAnswer: "A",
      difficulty: "medium"
    });
    
    this.createQuestion({
      questionText: "Solve for x: log₃(x) = 4",
      optionA: "12",
      optionB: "64",
      optionC: "81",
      optionD: "256",
      correctAnswer: "C",
      difficulty: "hard"
    });
    
    this.createQuestion({
      questionText: "What is the derivative of f(x) = x³ + 2x² - 4x + 7?",
      optionA: "3x² + 4x - 4",
      optionB: "3x² + 4x - 4 + 7",
      optionC: "3x² + 4x",
      optionD: "x² + 2x - 4",
      correctAnswer: "A",
      difficulty: "hard"
    });
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      lastLogin: null,
      createdAt: now,
      role: insertUser.role || 'student',
      school: insertUser.school || null,
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id: number, userData: Partial<InsertUser> & { lastLogin?: Date }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Question management
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const now = new Date();
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: now,
      difficulty: insertQuestion.difficulty || null,
      createdBy: insertQuestion.createdBy || null,
    };
    this.questions.set(id, question);
    return question;
  }
  async updateQuestion(id: number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion: Question = {
      ...question,
      ...questionData,
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  async listQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }
  
  // Quiz settings
  async getQuizSettings(): Promise<QuizSetting | undefined> {
    return this.quizSettings;
  }
  
  async createOrUpdateQuizSettings(settings: Partial<InsertQuizSetting>): Promise<QuizSetting> {
    const now = new Date();
    
    if (!this.quizSettings) {
      this.quizSettings = {
        id: 1,
        state: settings.state || 'waiting',
        startTime: null,
        endTime: null,
        lastReset: null,
        updatedAt: now,
      };
    } else {
      this.quizSettings = {
        ...this.quizSettings,
        ...settings,
        updatedAt: now,
      };
    }
    
    return this.quizSettings;
  }
  
  async startQuiz(): Promise<QuizSetting> {
    const now = new Date();
    if (!this.quizSettings) {
      this.quizSettings = {
        id: 1,
        state: 'started',
        startTime: now,
        endTime: null,
        lastReset: null,
        updatedAt: now,
      };
    } else {
      this.quizSettings = {
        ...this.quizSettings,
        state: 'started',
        startTime: now,
        updatedAt: now,
      };
    }
    
    return this.quizSettings;
  }
  
  async resetQuiz(): Promise<QuizSetting> {
    const now = new Date();
    
    this.quizSettings = {
      id: 1,
      state: 'waiting',
      startTime: null,
      endTime: null,
      lastReset: now,
      updatedAt: now,
    };
    
    // Clear all results and answers
    this.quizAnswers.clear();
    this.results.clear();
    this.quizAnswerIdCounter = 1;
    this.resultIdCounter = 1;
    
    return this.quizSettings;
  }
  
  // Quiz answers
  async saveQuizAnswer(insertAnswer: InsertQuizAnswer): Promise<QuizAnswer> {
    const id = this.quizAnswerIdCounter++;
    const now = new Date();

    // Check if the answer is correct
    const question = this.questions.get(insertAnswer.questionId);
    const isCorrect = question ?
      (question.correctAnswer === insertAnswer.userAnswer) : false;

    const answer: QuizAnswer = {
      ...insertAnswer,
      id,
      isCorrect: isCorrect,
      createdAt: now,
      userAnswer: insertAnswer.userAnswer || null,
      responseTimeSeconds: insertAnswer.responseTimeSeconds || null,
    };

    this.quizAnswers.set(id, answer);
    return answer;
  }
  async getQuizAnswersForUser(userId: number): Promise<QuizAnswer[]> {
    return Array.from(this.quizAnswers.values())
      .filter(answer => answer.userId === userId);
  }
  
  // Results
  async getResult(userId: number): Promise<Result | undefined> {
    return Array.from(this.results.values())
      .find(result => result.userId === userId);
  }
  
  async calculateScore(userId: number): Promise<{
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedAnswers: number;
    averageResponseTime: number;
  }> {
    // Get all user answers
    const userAnswers = await this.getQuizAnswersForUser(userId);
    
    // Get all questions
    const questions = await this.listQuestions();
    
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = questions.length - userAnswers.length;
    let totalResponseTime = 0;
    
    // Process each answer
    userAnswers.forEach(answer => {
      // Add response time to total
      if (answer.responseTimeSeconds) {
        totalResponseTime += answer.responseTimeSeconds;
      }
      
      // Find corresponding question
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return; // Skip if question not found
      
      // Check if answer is correct
      if (answer.userAnswer === null) {
        skippedCount++;
      } else if (answer.userAnswer === question.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });
    
    // Calculate score: +2 for correct, -1 for incorrect, 0 for skipped
    const finalScore = (correctCount * 2) - incorrectCount;
    
    // Calculate average response time
    const answeredCount = correctCount + incorrectCount;
    const averageTime = answeredCount > 0 ? Math.round(totalResponseTime / answeredCount) : 0;
    
    return {
      score: finalScore,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      skippedAnswers: skippedCount,
      averageResponseTime: averageTime
    };
  }

  async saveResult(insertResult: InsertResult): Promise<Result> {
    const id = this.resultIdCounter++;
    const now = new Date();

    // Recalculate the score server-side to ensure accuracy
    const calculatedScore = await this.calculateScore(insertResult.userId);

    const result: Result = {
      ...insertResult,
      id,
      createdAt: now,
      // Override submitted values with server-calculated values for security
      score: calculatedScore.score,
      correctAnswers: calculatedScore.correctAnswers,
      incorrectAnswers: calculatedScore.incorrectAnswers,
      skippedAnswers: calculatedScore.skippedAnswers,
      averageResponseTime: calculatedScore.averageResponseTime,
      completionTime: insertResult.completionTime || null,
      rank: null,
    };

    this.results.set(id, result);

    // Calculate rankings
    await this.calculateRankings();

    return this.results.get(id) as Result;
  }
  async updateResult(userId: number, resultData: Partial<InsertResult>): Promise<Result | undefined> {
    const existingResult = Array.from(this.results.values()).find(result => result.userId === userId);
    if (!existingResult) return undefined;

    // Recalculate the score server-side to ensure accuracy
    const calculatedScore = await this.calculateScore(userId);

    const updatedResult: Result = {
      ...existingResult,
      ...resultData,
      // Override submitted values with server-calculated values for security
      score: calculatedScore.score,
      correctAnswers: calculatedScore.correctAnswers,
      incorrectAnswers: calculatedScore.incorrectAnswers,
      skippedAnswers: calculatedScore.skippedAnswers,
      averageResponseTime: calculatedScore.averageResponseTime,
    };

    this.results.set(existingResult.id, updatedResult);

    // Calculate rankings
    await this.calculateRankings();

    return updatedResult;
  }

  async listResults(): Promise<Result[]> {
    return Array.from(this.results.values());
  }

  async calculateRankings(): Promise<void> {
    // Sort results by score in descending order
    const sortedResults = Array.from(this.results.values())
      .sort((a, b) => b.score - a.score);

    // Update rank for each result
    sortedResults.forEach((result, index) => {
      const updatedResult = {
        ...result,
        rank: index + 1
      };
      this.results.set(result.id, updatedResult);
    });
  }
}

export const storage = new MemStorage();
