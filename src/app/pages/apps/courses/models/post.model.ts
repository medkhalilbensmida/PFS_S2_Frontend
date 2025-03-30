import { File } from './file.model';
import { CourseComment } from './comment.model';

export interface Post {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  attachments?: File[]; // Utiliser l'interface File
  comments?: CourseComment[];
}