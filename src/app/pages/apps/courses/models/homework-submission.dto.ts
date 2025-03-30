export interface HomeworkSubmissionDto {
    id: number;
    submissionDate: string,
    grade: number;
    feedback: string;
    uploads: { id: number, originalname: string }[]
}
