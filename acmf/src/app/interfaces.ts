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
  institutionId: string;
  academicLevel: string;
  skills: string[];
  bio: string;
  course: string;
  interests: string[];
  profileImage?: string;
  coverPhoto: string | null;

  followersCount?: number;
  followingCount?: number;
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  userId: string;

  institution?: {
    id: string;
    name: string;
  };

  showFullBio?: boolean;
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
  institution?: {name: string} | null;
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

  likesCount?: number;
  likedByCurrentUser?: boolean;
  comments?: Comment[];
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
  deletedAt: string | null;
  user: {
    id: string;
    name: string;
    profile: {
      profileImage: string;
      institution: string;
    };
  };
  parentId?: string;
  likes?: number;
  isLikedByCurrentUser?: boolean;
  replies?: Comment[];
}

export interface CommentResponse {
  total: number;
  comments: Comment[];
}

export interface AcademicResource {
  id: string;
  title: string;
  description: string;
  course: string;
  unitName: string;
  semester: string;
  year: string;
  institution: string;
  fileUrl?: string | null;
  uploadedAt: string;
  downloadCount: number;
  uploader: {
    id: string;
    name: string;
    profileImage: string;
  };
  createdAt: string;
}

export interface CreateAcademicResourceRequest {
  title: string;
  description: string;
  course: string;
  unitName: string;
  semester: string;
  year: string;
  institution: string;
  fileUrl?: string;
}

export interface PostLike {
  id: string;
  profileId: string;
  postId: string;
  createdAt: string;
}

export interface PostLikeResponse {
  totalLikes: number;
  likes: PostLike[];
}

export interface InstitutionStats {
  institutionId: string;
  institutionName: string;
  totalPosts: number;
  totalResources: number;
}
export interface DashboardOverview {
  usersCount: number;
  postsCount: number;
  academicResourceCount: number;
  newSignUpsToday: number;
  newSignUpsLast7Days: number;
  newSignUpsThisMonth: number;

  likesCount: number;
  commentsCount: number;

  studentsPerInstitution?: {
    total?: Record<string, number>;
    today?: Record<string, number>;
    last7Days?: Record<string, number>;
    thisMonth?: Record<string, number>;
  };

  topInstitutions: {
    name: string;
    count: number;
  }[];

  topPosts: {
    id: string;
    title: string;
    fileUrl?: string | null;
    likesCount: number;
    commentsCount: number;
  }[];

  institutionStats: InstitutionStats[];
}


export interface AdminUserProfile {
  institution?: {
    id: string;
    name?: string;
  }

  profileImage?: string | null;

}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'SUSPENDED';
  profile?: AdminUserProfile | null;
  // counts for analytics
  totalPosts?: number;
  totalFollowers?: number;
  // for convenience
  posts?: { id: string }[];
  followers?: { id: string }[];
}

export interface BulkActionResponse {
  message: string;
}


export type FlagStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED';
export type PostStatusAction = 'DELETE' | 'RESTORE';

export interface AdminPostAuthorProfile {
  profileImage?: string | null;
  institution?: {
    id: string,
    name: string;
  }
  academicLevel?: string | null;
}

export interface AdminPostAuthor {
  id: string;
  name: string;
  profile: AdminPostAuthorProfile;
}

export interface AdminPost {
  id: string;
  title: string;
  body?: string | null;
  fileUrl?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  type: 'GENERAL' | 'ACADEMIC' | 'RESOURCE' | 'opportunity';
  isDeleted: boolean;
  deletedAt?: string | null;

  author: AdminPostAuthor;


  // counts coming from `_count`

  likesCount: number;
  commentsCount: number;
}

export interface PostFlagLiteReporter {
  id: string;
  name: string;
  profile: {
    profileImage?: string | null;
    institution?: {
      id: string;
      name: string;
    }
  };
}

export interface PostFlag {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  status: FlagStatus;
  createdAt: string;

  post: AdminPost;
  reporter: PostFlagLiteReporter;
}

export interface ChangePostStatusRequest {
  action: PostStatusAction; // 'DELETE' | 'RESTORE'
}

export interface UpdateFlagStatusRequest {
  status: FlagStatus;
}

export interface BulkPostIds {
  postIds: string[];
}

export type GroupVisibility = 'PUBLIC' | 'PRIVATE';

export interface GroupMember {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isDeleted?: boolean;
  user?: {
    id: string;
    name: string;
    profile?: Profile | null;
  };
}



export interface GroupResourceComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profile?: {
      profileImage?: string;
      institution: {
        id: string;
        name: string;
      }
    };
  };

  likesCount?: number; 
  isLikedByCurrentUser?: boolean; 
}


export interface GroupResource {
  id: string;
  content: string;
  resourceUrl: string;
  createdAt: string;
  sharedById: string;
  sharedBy?: {
    id: string;
    name: string;
    profile: {
      profileImage: string;
      institution: {
        id: string;
        name: string;
      } 
    }
  };
  likesCount: number;
  isLikedByCurrentUser: boolean;
  commentsCount: number;
  comments: GroupResourceComment[];
  originalName?: string | null;
  fileType?: string | null; 
  showMenu?: boolean;
  previewImage?: string;
}


export interface GroupMessage {
  id: string;
  content: string;
  groupId: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string; profileImage?: string | null };
  replyTo?: GroupMessage;
}

export interface GroupCreator {
  id: string;
  name: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  visibility: GroupVisibility;
  creatorId: string;
  creator?: GroupCreator;
  createdAt: string;
  updatedAt?: string;
  members?: GroupMember[];
  resources?: GroupResource[];
  _count?: { 
    members?: number; 
    resources?: number 
  };
  isDeleted?: boolean;
}




export interface BulkAddMembersDto {
  userIds: string[];
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}
export interface BulkRemoveMembersDto {
  userIds: string[];
}
export interface BulkRestoreMembersDto {
  userIds: string[];
}
export interface BulkUpdateRolesDto {
  userIds: string[];
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface ConversationParticipant {
  userId: string;
  user: Profile;
}

export interface Conversation {
  id: string;
  title?: string | null;
  isGroup: boolean;
  participants: ConversationParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: UserProfile;
  attachments?: string[] | null;
}

export interface UserProfile {
  id: string;
  name: string;
  profileImage?: string | null;
}

// Reuse your existing simple user shape:
export interface UserProfile {
  id: string;
  name: string;
  profileImage?: string | null;
}

/** Conversation item as shown in conversation list */
// --- Conversation summary (for sidebar/list) ---
export interface ConversationSummary {
  id: string;
  title?: string | null;
  isGroup: boolean;
  participants: ConversationParticipant[];
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender?: UserProfile | null;
  };
  unreadCount: number;
}

/** Full conversation details (if you need) */
export interface Conversation {
  id: string;
  title?: string | null;
  isGroup: boolean;
  participants: ConversationParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  profileImage?: string | null;
  lastReadAt?: string | null;
}

/** Message coming from REST or socket */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: UserProfile; // flattened shape: { id, name, profileImage }
  attachments?: string[] | null; // array of urls or attachment ids
}

/** Request to start a 1:1 conversation (REST) */
export interface StartConversationRequest {
  participantIds: string[]; // backend expects participantIds or recipientId
  isGroup?: boolean;
  title?: string | null;
}

/** Request used to send a message over REST */
export interface SendMessageRequest {
  conversationId?: string;
  recipientId?: string; // optional convenience: backend can create one-on-one
  content: string;
  attachments?: string[] | null;
}

/** WebSocket client -> server payload */
export interface DmSocketSendPayload {
  conversationId?: string;
  recipientId?: string;
  content: string;
  tempId?: string | null; // optional client temp id for local optimistic UI
  attachments?: string[] | null;
}

/** WebSocket events */
export interface DmTypingEvent {
  conversationId: string;
  userId: string;
  typing: boolean;
}

export interface DmReadEvent {
  conversationId: string;
  userId: string;
  lastReadAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  fileUrls?: string[];
  createdAt: string;
  updatedAt: string;

  createdBy: {
    id: string;
    email: string;
    profile: {
      name: string;
      profileImage?: string;
    };
  };

  institution: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}

export interface InstitutionAnalytics {
  studentCount: number;
  announcementCount: number;
}

export interface Institution {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface StudentNotification {
  id: string;
  recipientId: string;
  type: string;
  referenceId: string | null;
  message: string;
  status: 'UNREAD' | 'READ' | string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  readAt?: string | null;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  content?: string;
  institution?: { id: string; name?: string };
  fileUrls?: string[];
  createdAt?: string;
}

export interface FlaggedPost {
  id: string;
  reason?: string | null;
  status: string;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    profileImage?: string | null;
    institution?: {
      id: string;
      name: string;
    };
  };
  post: {
    id: string;
    title: string;
    body?: string;
    fileUrl?: string | null;
    type: string;
    author: {
      id: string;
      name: string;
      profileImage?: string | null;
      institution?: {
        id: string;
        name: string;
      };
    };
    likesCount: number;
    commentsCount: number;
  };
}

export interface FlagPostResponse {
  message: string;
  flaggedPost: FlaggedPost;
}
