export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string;
  division: string;
  bio: string;
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhoto: string;
  content: string;
  imageURL?: string;
  tags: string[];
  groupTags: string[];
  likes: string[];
  commentCount?: number;
  visibility: "global" | "friends";
  repostOf?: string;
  repostAuthorName?: string;
  repostAuthorUsername?: string;
  createdAt: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromUsername: string;
  fromPhoto: string;
  toId: string;
  toName: string;
  toUsername: string;
  note: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

export interface Friend {
  id: string;
  odId: string;
  odName: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendPhoto: string;
  since: number;
}

export interface Chat {
  id: string;
  type: "private" | "group";
  name: string;
  members: string[];
  memberNames: Record<string, string>;
  memberPhotos: Record<string, string>;
  lastMessage: string;
  lastMessageBy: string;
  lastReadAt?: Record<string, number>;
  typing?: Record<string, number>;
  updatedAt: number;
  createdBy: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  content: string;
  createdAt: number;
}

export interface PendingMessage extends Message {
  status: "sending" | "failed";
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhoto: string;
  content: string;
  createdAt: number;
}

export const MAX_POST_WORDS = 500;
export const MAX_POST_CHARS = 3000;
export const POST_PREVIEW_WORDS = 100;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
