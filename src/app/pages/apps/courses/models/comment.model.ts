export interface CourseComment {
    id: number;
    content: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      type: 'teacher' | 'student';
    };
    post: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }