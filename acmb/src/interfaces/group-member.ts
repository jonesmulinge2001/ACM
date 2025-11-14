/* eslint-disable prettier/prettier */
export interface GroupMemberResponse {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    profile: {
      profileImage?: string | null;
      institution?: { id: string; name: string } | null;
    };
  };
}
