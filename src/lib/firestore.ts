import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { UserProfile, Post, FriendRequest, Friend, Chat, Message } from "@/types";

// ─── User Operations ───

export async function createUserProfile(user: UserProfile) {
  await setDoc(doc(getFirebaseDb(), "users", user.uid), user);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(getFirebaseDb(), "users", uid), data);
}

export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
  const q = query(
    collection(getFirebaseDb(), "users"),
    where("username", ">=", searchTerm.toLowerCase()),
    where("username", "<=", searchTerm.toLowerCase() + "\uf8ff"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

// ─── Post Operations ───

export async function createPost(post: Omit<Post, "id">) {
  const ref = await addDoc(collection(getFirebaseDb(), "posts"), post);
  return ref.id;
}

export function subscribeToPosts(callback: (posts: Post[]) => void) {
  const q = query(collection(getFirebaseDb(), "posts"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Post));
    callback(posts);
  });
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  const ref = doc(getFirebaseDb(), "posts", postId);
  if (liked) {
    await updateDoc(ref, { likes: arrayRemove(userId) });
  } else {
    await updateDoc(ref, { likes: arrayUnion(userId) });
  }
}

export async function deletePost(postId: string) {
  await deleteDoc(doc(getFirebaseDb(), "posts", postId));
}

// ─── Friend Request Operations ───

export async function sendFriendRequest(request: Omit<FriendRequest, "id">) {
  const ref = await addDoc(collection(getFirebaseDb(), "friendRequests"), request);
  return ref.id;
}

export function subscribeToFriendRequests(userId: string, callback: (reqs: FriendRequest[]) => void) {
  const q = query(
    collection(getFirebaseDb(), "friendRequests"),
    where("toId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const reqs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
    callback(reqs);
  });
}

export async function respondToFriendRequest(requestId: string, status: "accepted" | "rejected") {
  await updateDoc(doc(getFirebaseDb(), "friendRequests", requestId), { status });
}

// ─── Friend Operations ───

export async function addFriend(userId: string, friend: Omit<Friend, "id">) {
  await addDoc(collection(getFirebaseDb(), "friends"), friend);
}

export function subscribeToFriends(userId: string, callback: (friends: Friend[]) => void) {
  const q = query(collection(getFirebaseDb(), "friends"), where("userId", "==", userId));
  return onSnapshot(q, (snap) => {
    const friends = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Friend));
    callback(friends);
  });
}

export async function removeFriend(friendDocId: string) {
  await deleteDoc(doc(getFirebaseDb(), "friends", friendDocId));
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const q = query(collection(getFirebaseDb(), "friends"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().friendId);
}

// ─── Chat Operations ───

export async function createChat(chat: Omit<Chat, "id">) {
  const ref = await addDoc(collection(getFirebaseDb(), "chats"), chat);
  return ref.id;
}

export function subscribeToChats(userId: string, callback: (chats: Chat[]) => void) {
  const q = query(
    collection(getFirebaseDb(), "chats"),
    where("members", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Chat));
    callback(chats);
  });
}

export async function sendMessage(message: Omit<Message, "id">) {
  const ref = await addDoc(collection(getFirebaseDb(), "messages"), message);
  await updateDoc(doc(getFirebaseDb(), "chats", message.chatId), {
    lastMessage: message.content,
    lastMessageBy: message.senderId,
    updatedAt: Date.now(),
  });
  return ref.id;
}

export function subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
  const q = query(
    collection(getFirebaseDb(), "messages"),
    where("chatId", "==", chatId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Message));
    callback(messages);
  });
}

export async function findPrivateChat(userId: string, friendId: string): Promise<Chat | null> {
  const q = query(
    collection(getFirebaseDb(), "chats"),
    where("type", "==", "private"),
    where("members", "array-contains", userId)
  );
  const snap = await getDocs(q);
  const chat = snap.docs.find((d) => {
    const data = d.data() as Chat;
    return data.members.includes(friendId);
  });
  return chat ? ({ ...chat.data(), id: chat.id } as Chat) : null;
}
