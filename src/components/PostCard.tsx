"use client";

import { useState, useEffect } from "react";
import { Post, Comment } from "@/types";
import { toggleLike, deletePost, createPost, addComment, subscribeToComments, deleteComment } from "@/lib/firestore";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import {
  HiHeart,
  HiOutlineHeart,
  HiChatBubbleLeft,
  HiArrowPath,
  HiEllipsisHorizontal,
  HiTrash,
  HiGlobeAlt,
  HiUserCircle,
  HiPaperAirplane,
} from "react-icons/hi2";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const user = useAuthStore((s) => s.user);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const liked = user ? post.likes?.includes(user.uid) : false;
  const likeCount = post.likes?.length || 0;
  const commentCount = post.commentCount || comments.length || 0;

  useEffect(() => {
    if (!showComments) return;
    const unsub = subscribeToComments(post.id, setComments);
    return () => unsub();
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!user) return;
    await toggleLike(post.id, user.uid, liked);
  };

  const handleRepost = async () => {
    if (!user) return;
    await createPost({
      authorId: user.uid,
      authorName: user.displayName,
      authorUsername: user.username,
      authorPhoto: user.photoURL,
      content: post.content,
      imageURL: post.imageURL,
      tags: [],
      groupTags: [],
      likes: [],
      visibility: post.visibility || "friends",
      repostOf: post.id,
      repostAuthorName: post.authorName,
      repostAuthorUsername: post.authorUsername,
      createdAt: Date.now(),
    });
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    setShowMenu(false);
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;
    setSendingComment(true);
    try {
      await addComment({
        postId: post.id,
        authorId: user.uid,
        authorName: user.displayName,
        authorUsername: user.username,
        authorPhoto: user.photoURL,
        content: commentText.trim(),
        createdAt: Date.now(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
    setSendingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId, post.id);
  };

  return (
    <article className="bg-white rounded-2xl border border-blue-50 p-4 hover:shadow-md transition-shadow">
      {post.repostOf && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 ml-1">
          <HiArrowPath className="w-3.5 h-3.5" />
          <span>Reposted from <strong className="text-gray-500">@{post.repostAuthorUsername}</strong></span>
        </div>
      )}

      <div className="flex gap-3">
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-600 font-semibold">
                {post.authorName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm truncate max-w-[120px] sm:max-w-none">{post.authorName}</span>
                <span className="text-gray-400 text-xs truncate">@{post.authorUsername}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-gray-400 text-[11px]">
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                </span>
                <span className="text-gray-300 text-[11px]">·</span>
                {post.visibility === "global" ? (
                  <HiGlobeAlt className="w-3 h-3 text-green-500" />
                ) : (
                  <HiUserCircle className="w-3 h-3 text-blue-400" />
                )}
              </div>
            </div>

            {user?.uid === post.authorId && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-blue-50 transition-colors"
                >
                  <HiEllipsisHorizontal className="w-5 h-5 text-gray-400" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36 z-10">
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <HiTrash className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-gray-800 mt-1 whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </p>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-blue-500 text-xs font-medium">@{tag}</span>
              ))}
            </div>
          )}

          {post.groupTags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.groupTags.map((tag) => (
                <span key={tag} className="text-purple-500 text-xs font-medium bg-purple-50 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {post.imageURL && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
              <img src={post.imageURL} alt="" className="w-full object-cover max-h-96" />
            </div>
          )}

          <div className="flex items-center gap-6 mt-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
            >
              {liked ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                showComments ? "text-blue-500" : "text-gray-400 hover:text-blue-500"
              }`}
            >
              <HiChatBubbleLeft className="w-5 h-5" />
              {commentCount > 0 && <span>{commentCount}</span>}
            </button>

            <button
              onClick={handleRepost}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-500 transition-colors"
            >
              <HiArrowPath className="w-5 h-5" />
            </button>
          </div>

          {showComments && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
              {comments.length > 0 && (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden shrink-0">
                        {c.authorPhoto ? (
                          <img src={c.authorPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-600 text-[10px] font-semibold">
                            {c.authorName?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-900 text-xs truncate">{c.authorName}</span>
                            <span className="text-gray-400 text-[10px] truncate">@{c.authorUsername}</span>
                          </div>
                          <p className="text-gray-700 text-xs mt-0.5 whitespace-pre-wrap">{c.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 ml-1">
                          <span className="text-gray-400 text-[10px]">
                            {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                          </span>
                          {user?.uid === c.authorId && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-red-400 text-[10px] hover:text-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {comments.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-2">No comments yet</p>
              )}

              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-600 text-[10px] font-semibold">
                      {user?.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex gap-1.5">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-all"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={sendingComment || !commentText.trim()}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    <HiPaperAirplane className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
