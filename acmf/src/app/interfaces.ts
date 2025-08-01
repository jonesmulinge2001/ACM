export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'ADMIN' | 'STUDENT';
}

export interface RegisterResponse {
    message: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
    };
}

export interface VerifyEmailRequest {
    email: string;
    code: string;
}

export interface GenericResponse {
    message: string;
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    password: string;
}

export interface Profile {
    id?: string;
    name: string;
    email: string;
    institution: string;
    academicLevel: string;
    skills: string[];
    bio: string;
    course: string;
    interests: string[],
    profileImage?: string;
    coverPhoto: string | null;

    followersCount?: number;
    followingCount?: number;
    viewsCount?: number;
    createdAt?: string;
    updatedAt?: string;
    userId: string;
}

export interface ProfileView {
    id: string;
    viewer: {
      profile: Profile;
    };
    createdAt: string;
  }

  export interface Follow {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: string;
    follower?: {
      profile: Profile;
    };
    following?: {
      profile: Profile;
    };
  }
  
  export interface Author {
    id: string;
    name: string;
    profileImage?: string | null;
    institution?: string;
    academicLevel?: string;
  }
  
  export interface Post {
    id: string;
    title: string;
    body?: string;
    fileUrl?: string;
    createdAt: string;
    updatedAt: string;
    type: 'GENERAL' | 'ACADEMIC' | 'RESOURCE' | 'opportunity';
    author: Author;
    tags?: string[];
  }
  
  
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  follower?: {
    profile: Profile;
  };
  following?: {
    profile: Profile;
  };
}

export interface CommentUserProfile {
  profileImage: string;
  institution: string;
}

export interface CommentUser {
  id: string;
  name: string;
  profile: CommentUserProfile;
}

export interface Comment {
  id: string;
  body: string;
  postId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  user: CommentUser
}

export interface CommentResponse {
  total: number;
  comments: Comment[];
}