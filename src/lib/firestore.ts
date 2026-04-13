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
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { UserProfile, Post, FriendRequest, Friend, Chat, Message, Comment } from "@/types";

function snapshotErrorHandler(context: string) {
  return (error: Error) => {
    console.warn(`[Firestore] ${context} listener error (index may still be building):`, error.message);
  };
}

function toMillis(val: any): number {
  if (!val) return Date.now();
  if (typeof val === "number") return val;
  if (typeof val?.toMillis === "function") return val.toMillis();
  if (val?.seconds) return val.seconds * 1000;
  return Date.now();
}

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

export async function isUsernameAvailable(username: string, currentUid: string): Promise<boolean> {
  const q = query(
    collection(getFirebaseDb(), "users"),
    where("username", "==", username),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;
  return snap.docs[0].data().uid === currentUid;
}

// ─── Post Operations ───

export async function createPost(post: Omit<Post, "id">) {
  const data = Object.fromEntries(
    Object.entries(post).filter(([, v]) => v !== undefined)
  );
  const ref = await addDoc(collection(getFirebaseDb(), "posts"), data);
  return ref.id;
}

export function subscribeToPosts(callback: (posts: Post[]) => void) {
  const q = query(collection(getFirebaseDb(), "posts"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Post));
    callback(posts);
  }, snapshotErrorHandler("posts"));
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
  const db = getFirebaseDb();
  const commentsQuery = query(collection(db, "comments"), where("postId", "==", postId));
  const commentSnap = await getDocs(commentsQuery);

  const batch = writeBatch(db);
  commentSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "posts", postId));
  await batch.commit();
}

export async function hasUserReposted(postId: string, userId: string): Promise<boolean> {
  const q = query(
    collection(getFirebaseDb(), "posts"),
    where("repostOf", "==", postId),
    where("authorId", "==", userId),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// ─── Friend Request Operations ───

export async function sendFriendRequest(request: Omit<FriendRequest, "id">) {
  const ref = await addDoc(collection(getFirebaseDb(), "friendRequests"), request);
  return ref.id;
}

export async function hasPendingRequest(fromId: string, toId: string): Promise<boolean> {
  const q = query(
    collection(getFirebaseDb(), "friendRequests"),
    where("fromId", "==", fromId),
    where("toId", "==", toId),
    where("status", "==", "pending"),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getPendingRequestIds(fromId: string): Promise<string[]> {
  const q = query(
    collection(getFirebaseDb(), "friendRequests"),
    where("fromId", "==", fromId),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().toId);
}

export function subscribeToFriendRequests(userId: string, callback: (reqs: FriendRequest[]) => void) {
  const q = query(
    collection(getFirebaseDb(), "friendRequests"),
    where("toId", "==", userId),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snap) => {
    const reqs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
    reqs.sort((a, b) => b.createdAt - a.createdAt);
    callback(reqs);
  }, snapshotErrorHandler("friendRequests"));
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
  }, snapshotErrorHandler("friends"));
}

export async function removeFriendBidirectional(userId: string, friendId: string) {
  const db = getFirebaseDb();
  const q1 = query(
    collection(db, "friends"),
    where("userId", "==", userId),
    where("friendId", "==", friendId)
  );
  const q2 = query(
    collection(db, "friends"),
    where("userId", "==", friendId),
    where("friendId", "==", userId)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const batch = writeBatch(db);
  snap1.docs.forEach((d) => batch.delete(d.ref));
  snap2.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
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
    where("members", "array-contains", userId)
  );
  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, id: d.id, updatedAt: toMillis(data.updatedAt) } as Chat;
    });
    chats.sort((a, b) => b.updatedAt - a.updatedAt);
    callback(chats);
  }, snapshotErrorHandler("chats"));
}

export async function sendMessage(message: Omit<Message, "id">) {
  const db = getFirebaseDb();
  const msgData = {
    ...message,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, "messages"), msgData);
  await updateDoc(doc(db, "chats", message.chatId), {
    lastMessage: message.content.slice(0, 100),
    lastMessageBy: message.senderId,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
  onError?: (err: Error) => void,
) {
  // No orderBy/limit so the listener watches ALL messages for this chat and
  // fires on every new message — fully real-time. Sort client-side instead.
  const q = query(
    collection(getFirebaseDb(), "messages"),
    where("chatId", "==", chatId)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: toMillis(data.createdAt),
      } as Message;
    });
    messages.sort((a, b) => a.createdAt - b.createdAt);
    callback(messages);
  }, (error) => {
    console.warn("[Firestore] messages listener error:", error.message);
    if (onError) onError(error);
  });
}

export async function findPrivateChat(userId: string, friendId: string): Promise<Chat | null> {
  try {
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
    if (!chat) return null;
    const data = chat.data();
    return { ...data, id: chat.id, updatedAt: toMillis(data.updatedAt) } as Chat;
  } catch (err) {
    console.warn("[Firestore] findPrivateChat error:", err);
    return null;
  }
}

export async function markChatRead(chatId: string, userId: string) {
  await updateDoc(doc(getFirebaseDb(), "chats", chatId), {
    [`lastReadAt.${userId}`]: Date.now(),
  }).catch(() => {});
}

export async function setTypingStatus(chatId: string, userId: string, isTyping: boolean) {
  const update = isTyping
    ? { [`typing.${userId}`]: Date.now() }
    : { [`typing.${userId}`]: 0 };
  await updateDoc(doc(getFirebaseDb(), "chats", chatId), update).catch(() => {});
}

export function subscribeToChatDoc(chatId: string, callback: (chat: Chat | null) => void) {
  return onSnapshot(doc(getFirebaseDb(), "chats", chatId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({ ...data, id: snap.id, updatedAt: toMillis(data.updatedAt) } as Chat);
    } else {
      callback(null);
    }
  }, snapshotErrorHandler("chatDoc"));
}

// ─── Comment Operations ───

export async function addComment(comment: Omit<Comment, "id">) {
  const ref = await addDoc(collection(getFirebaseDb(), "comments"), comment);
  await updateDoc(doc(getFirebaseDb(), "posts", comment.postId), {
    commentCount: increment(1),
  }).catch(() => {});
  return ref.id;
}

export function subscribeToComments(
  postId: string,
  callback: (comments: Comment[]) => void,
  onError?: (err: Error) => void,
) {
  // No orderBy to avoid requiring a composite index that may not be deployed.
  // We sort client-side after receiving docs.
  const q = query(
    collection(getFirebaseDb(), "comments"),
    where("postId", "==", postId)
  );
  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, id: d.id, createdAt: toMillis(data.createdAt) } as Comment;
    });
    comments.sort((a, b) => a.createdAt - b.createdAt);
    callback(comments);
  }, (error) => {
    console.warn("[Firestore] comments listener error:", error.message);
    if (onError) onError(error);
  });
}

export async function deleteComment(commentId: string, postId: string) {
  await deleteDoc(doc(getFirebaseDb(), "comments", commentId));
  await updateDoc(doc(getFirebaseDb(), "posts", postId), {
    commentCount: increment(-1),
  }).catch(() => {});
}
