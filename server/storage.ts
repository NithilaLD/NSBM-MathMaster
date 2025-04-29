
import fs from 'fs';
import path from 'path';
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

// Define the storage directory for JSON files
const DATA_DIR = path.join(process.cwd(), 'data');

// Create the data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths for different data stores
const FILES = {
  USERS: path.join(DATA_DIR, 'users.json'),
  QUESTIONS: path.join(DATA_DIR, 'questions.json'),
  QUIZ_SETTINGS: path.join(DATA_DIR, 'quiz_settings.json'),
  QUIZ_ANSWERS: path.join(DATA_DIR, 'quiz_answers.json'),
  RESULTS: path.join(DATA_DIR, 'results.json'),
  COUNTERS: path.join(DATA_DIR, 'counters.json'),
};

// Default data for initialization
const DEFAULT_DATA = {
  USERS: [] as User[],
  QUESTIONS: [] as Question[],
  QUIZ_SETTINGS: {
    id: 1,
    state: 'waiting',
    startTime: null,
    endTime: null,
    lastReset: null,
    updatedAt: new Date(),
  } as QuizSetting,
  QUIZ_ANSWERS: [] as QuizAnswer[],
  RESULTS: [] as Result[],
  COUNTERS: {
    userIdCounter: 1,
    questionIdCounter: 1,
    quizAnswerIdCounter: 1,
    resultIdCounter: 1,
  },
};

// Helper function to read JSON file
function readJsonFile<T>(filePath: string, defaultData: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data, (key, value) => {
        // Parse ISO dates back to Date objects
        if (typeof value === 'string' && 
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }

  return defaultData;
}

// Helper function to write JSON file
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

export class JsonStorage implements IStorage {
  private users: User[];
  private questions: Question[];
  private quizSettings: QuizSetting;
  private quizAnswers: QuizAnswer[];
  private results: Result[];

  private userIdCounter: number;
  private questionIdCounter: number;
  private quizAnswerIdCounter: number;
  private resultIdCounter: number;

  constructor() {
    // Initialize with data from files or defaults
    this.users = readJsonFile<User[]>(FILES.USERS, DEFAULT_DATA.USERS);
    this.questions = readJsonFile<Question[]>(FILES.QUESTIONS, DEFAULT_DATA.QUESTIONS);
    this.quizSettings = readJsonFile<QuizSetting>(FILES.QUIZ_SETTINGS, DEFAULT_DATA.QUIZ_SETTINGS);
    this.quizAnswers = readJsonFile<QuizAnswer[]>(FILES.QUIZ_ANSWERS, DEFAULT_DATA.QUIZ_ANSWERS);
    this.results = readJsonFile<Result[]>(FILES.RESULTS, DEFAULT_DATA.RESULTS);

    const counters = readJsonFile(FILES.COUNTERS, DEFAULT_DATA.COUNTERS);
    this.userIdCounter = counters.userIdCounter;
    this.questionIdCounter = counters.questionIdCounter;
    this.quizAnswerIdCounter = counters.quizAnswerIdCounter;
    this.resultIdCounter = counters.resultIdCounter;

    // Create default data if no data exists
    if (this.users.length === 0) {
      this.createDefaultUsers();
    }

    // if (this.questions.length === 0) {
    //   this.createDefaultQuestions();
    // }

    // Save counters to ensure they are persisted
    this.saveCounters();
  }

  private saveCounters(): void {
    const counters = {
      userIdCounter: this.userIdCounter,
      questionIdCounter: this.questionIdCounter,
      quizAnswerIdCounter: this.quizAnswerIdCounter,
      resultIdCounter: this.resultIdCounter,
    };

    writeJsonFile(FILES.COUNTERS, counters);
  }

  private createDefaultUsers(): void {
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
  }

  // private createDefaultQuestions(): void {
  //   // Add sample math questions for testing
  //   // this.createQuestion({
  //   //   questionText: "What is the value of x in the equation 2x + 5 = 13?",
  //   //   optionA: "3",
  //   //   optionB: "4",
  //   //   optionC: "5",
  //   //   optionD: "6",
  //   //   correctAnswer: "B",
  //   //   difficulty: "easy"
  //   // });

  //   // this.createQuestion({
  //   //   questionText: "Find the area of a circle with radius 5 cm. (Use π = 3.14)",
  //   //   optionA: "15.7 cm²",
  //   //   optionB: "31.4 cm²",
  //   //   optionC: "78.5 cm²",
  //   //   optionD: "153.86 cm²",
  //   //   correctAnswer: "C",
  //   //   difficulty: "medium"
  //   // });

  //   // this.createQuestion({
  //   //   questionText: "If sin(θ) = 0.5, what is θ?",
  //   //   optionA: "30°",
  //   //   optionB: "45°",
  //   //   optionC: "60°",
  //   //   optionD: "90°",
  //   //   correctAnswer: "A",
  //   //   difficulty: "medium"
  //   // });

  //   // this.createQuestion({
  //   //   questionText: "Solve for x: log₃(x) = 4",
  //   //   optionA: "12",
  //   //   optionB: "64",
  //   //   optionC: "81",
  //   //   optionD: "256",
  //   //   correctAnswer: "C",
  //   //   difficulty: "hard"
  //   // });

  //   // this.createQuestion({
  //   //   questionText: "What is the derivative of f(x) = x³ + 2x² - 4x + 7?",
  //   //   optionA: "3x² + 4x - 4",
  //   //   optionB: "3x² + 4x - 4 + 7",
  //   //   optionC: "3x² + 4x",
  //   //   optionD: "x² + 2x - 4",
  //   //   correctAnswer: "A",
  //   //   difficulty: "hard"
  //   // });
  // }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username.toLowerCase() === username.toLowerCase());
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

    this.users.push(user);
    writeJsonFile(FILES.USERS, this.users);
    this.saveCounters();

    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser> & { lastLogin?: Date }): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    const updatedUser: User = {
      ...this.users[userIndex],
      ...userData,
    };

    this.users[userIndex] = updatedUser;
    writeJsonFile(FILES.USERS, this.users);

    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);

    const deleted = initialLength > this.users.length;
    if (deleted) {
      writeJsonFile(FILES.USERS, this.users);
    }

    return deleted;
  }

  async listUsers(): Promise<User[]> {
    return this.users;
  }

  // Question management
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.find(question => question.id === id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const now = new Date();
    const question: Question = {
      id,
      createdAt: now,
      questionText: insertQuestion.questionText || null,
      questionImage: insertQuestion.questionImage || null,
      optionA: insertQuestion.optionA,
      optionB: insertQuestion.optionB,
      optionC: insertQuestion.optionC,
      optionD: insertQuestion.optionD,
      correctAnswer: insertQuestion.correctAnswer,
      difficulty: insertQuestion.difficulty || null,
      createdBy: insertQuestion.createdBy || null,
      isImage: insertQuestion.isImage || false,
    };

    this.questions.push(question);
    writeJsonFile(FILES.QUESTIONS, this.questions);
    this.saveCounters();

    return question;
  }

  async updateQuestion(id: number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const questionIndex = this.questions.findIndex(question => question.id === id);
    if (questionIndex === -1) return undefined;

    const updatedQuestion: Question = {
      ...this.questions[questionIndex],
      ...questionData,
    };

    this.questions[questionIndex] = updatedQuestion;
    writeJsonFile(FILES.QUESTIONS, this.questions);

    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const initialLength = this.questions.length;
    this.questions = this.questions.filter(question => question.id !== id);

    const deleted = initialLength > this.questions.length;
    if (deleted) {
      writeJsonFile(FILES.QUESTIONS, this.questions);
    }

    return deleted;
  }

  async listQuestions(): Promise<Question[]> {
    return this.questions;
  }

  // Quiz settings
  async getQuizSettings(): Promise<QuizSetting | undefined> {
    return this.quizSettings;
  }

  async createOrUpdateQuizSettings(settings: Partial<InsertQuizSetting>): Promise<QuizSetting> {
    const now = new Date();

    this.quizSettings = {
      ...this.quizSettings,
      ...settings,
      updatedAt: now,
    };

    writeJsonFile(FILES.QUIZ_SETTINGS, this.quizSettings);
    return this.quizSettings;
  }

  async startQuiz(): Promise<QuizSetting> {
    const now = new Date();

    this.quizSettings = {
      ...this.quizSettings,
      state: 'started',
      startTime: now,
      updatedAt: now,
    };

    writeJsonFile(FILES.QUIZ_SETTINGS, this.quizSettings);
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
    this.quizAnswers = [];
    this.results = [];
    this.quizAnswerIdCounter = 1;
    this.resultIdCounter = 1;

    writeJsonFile(FILES.QUIZ_SETTINGS, this.quizSettings);
    writeJsonFile(FILES.QUIZ_ANSWERS, this.quizAnswers);
    writeJsonFile(FILES.RESULTS, this.results);
    this.saveCounters();

    return this.quizSettings;
  }

  // Quiz answers
  async saveQuizAnswer(insertAnswer: InsertQuizAnswer): Promise<QuizAnswer> {
    const id = this.quizAnswerIdCounter++;
    const now = new Date();

    // Find the question to check if the answer is correct
    const question = this.questions.find(q => q.id === insertAnswer.questionId);
    const isCorrect = question ? (question.correctAnswer === insertAnswer.userAnswer) : false;

    const answer: QuizAnswer = {
      ...insertAnswer,
      id,
      isCorrect: isCorrect,
      createdAt: now,
      userAnswer: insertAnswer.userAnswer || null,
      responseTimeSeconds: insertAnswer.responseTimeSeconds || null,
    };

    this.quizAnswers.push(answer);
    writeJsonFile(FILES.QUIZ_ANSWERS, this.quizAnswers);
    this.saveCounters();

    return answer;
  }

  async getQuizAnswersForUser(userId: number): Promise<QuizAnswer[]> {
    return this.quizAnswers.filter(answer => answer.userId === userId);
  }

  // Results
  async getResult(userId: number): Promise<Result | undefined> {
    return this.results.find(result => result.userId === userId);
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

    this.results.push(result);
    writeJsonFile(FILES.RESULTS, this.results);
    this.saveCounters();

    // Calculate rankings
    await this.calculateRankings();

    return this.results.find(r => r.id === id) as Result;
  }

  async listResults(): Promise<Result[]> {
    return this.results;
  }

  async calculateRankings(): Promise<void> {
    // Sort results by score in descending order
    this.results.sort((a, b) => b.score - a.score);

    // Update rank for each result
    this.results.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Save updated rankings
    writeJsonFile(FILES.RESULTS, this.results);
  }
}

// Export the JSON storage implementation
export const storage = new JsonStorage();
