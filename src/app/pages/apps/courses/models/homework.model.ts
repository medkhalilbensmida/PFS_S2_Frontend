export interface Homework {
    id: number;
    title: string;
    description: string;
    deadline: string;
    createdAt: string;
    updatedAt?: string;
    deletedAt: string | null;
    files: { id: number; originalname: string }[];
  }
