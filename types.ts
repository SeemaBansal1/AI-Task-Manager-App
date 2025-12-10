export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_RESULT = 'AWAITING_RESULT', // For "Past action that have some result awaited"
  DONE = 'DONE'
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum ReminderMethod {
  NOTIFICATION = 'NOTIFICATION',
  WHATSAPP = 'WHATSAPP',
  CALENDAR = 'CALENDAR'
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface LinkAttachment {
  url: string;
  title: string;
}

export interface Reminder {
  dateTime: string; // ISO date-time string
  method: ReminderMethod;
  notified?: boolean; // Track if we already fired this reminder
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string; // ISO Date string
  category: string; 
  status: TaskStatus;
  priority: Priority;
  createdAt: number;
  completedAt?: number; // Timestamp when task was marked done
  
  // New features
  subtasks: Subtask[];
  links: LinkAttachment[];
  reminder?: Reminder;
}

export interface UserStats {
  streak: number;
  lastLoginDate: string; // YYYY-MM-DD
  lastCompletionDate?: string; // YYYY-MM-DD - For accurate streak tracking
  tasksCompletedTotal: number;
}

export interface AiMotivationResponse {
  message: string;
  quote: string;
}