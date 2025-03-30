import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { CourseComment } from '../models/comment.model';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getPostsByCourseId(courseId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/courses/${courseId}/posts`);
  }

  createPost(courseId: number, postData: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/courses/${courseId}/posts`, postData);
  }

  getCommentsByPostId(postId: number): Observable<CourseComment[]> {
    return this.http.get<CourseComment[]>(`${this.apiUrl}/courses/posts/comments/${postId}`);
  }

  createComment(postId: number, comment: { content: string }): Observable<CourseComment> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<CourseComment>(`${this.apiUrl}/courses/posts/${postId}/comments`, comment, { headers });
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/courses/posts/${postId}/comments/${commentId}`);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/courses/posts/${postId}`);
  }
}