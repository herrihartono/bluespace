"use client";

import { useState } from "react";
import { Post } from "@/types";
import { toggleLike, deletePost, createPost } from "@/lib/firestore";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import { HiHeart, HiOutlineHeart, HiChatBubbleLeft, HiArrowPath, HiEllipsisHorizontal, HiTrash } from "react-icons/hi2";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const user = useAuthStore((s) => s.user);
  const [showMenu, setShowMenu] = useState(false);

  const liked = user ? post.likes?.includes(user.uid) : false;
  const likeCount = post.likes?.length || 0;

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{post.authorName}</span>
              <span className="text-gray-400 text-sm">@{post.authorUsername}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-gray-400 text-xs">
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </span>
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

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-blue-500 text-xs font-medium">@{tag}</span>
              ))}
            </div>
          )}

          {post.groupTags.length > 0 && (
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

            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors">
              <HiChatBubbleLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleRepost}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-500 transition-colors"
            >
              <HiArrowPath className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
