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
