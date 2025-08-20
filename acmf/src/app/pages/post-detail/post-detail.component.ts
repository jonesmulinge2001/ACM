import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Post {
  id: string;
  title: string;
  body?: string;
  fileUrl?: string;
  likesCount: number;
  commentsCount: number;
}

interface Comment {
  id: string;
  content: string;
  author?: { name: string };
}

@Component({
  imports: [CommonModule],
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comments: Comment[] = [];
  isLoading = true;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.fetchPost(postId);
      this.fetchComments(postId);
    }
  }

  fetchPost(id: string) {
    this.http.get<Post>(`http://localhost:3000/posts/${id}`).subscribe({
      next: (data) => {
        this.post = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load post', err);
        this.isLoading = false;
      },
    });
  }

  fetchComments(postId: string) {
    this.http.get<Comment[]>(`http://localhost:3000/posts/${postId}/comments`).subscribe({
      next: (data) => (this.comments = data),
      error: (err) => console.error('Failed to load comments', err),
    });
  }
}
