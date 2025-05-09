export type TaskCategory = 'work' | 'private' | 'other';

export interface CategoryResult {
  task: string;
  category: TaskCategory;
} 