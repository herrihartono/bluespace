"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { createPost } from "@/lib/firestore";
import { uploadImage } from "@/lib/storage";
import { HiPhoto, HiUserPlus, HiUserGroup, HiXMark, HiGlobeAlt, HiUserCircle } from "react-icons/hi2";

interface CreatePostProps {
  friends: { username: string; uid: string }[];
  groups: { id: string; name: string }[];
}

export default function CreatePost({ friends, groups }: CreatePostProps) {
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"global" | "friends">("friends");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!user || (!content.trim() && !imageFile)) return;
    setPosting(true);
    setError(null);
    try {
      let imageURL: string | undefined;
      if (imageFile) {
        imageURL = await uploadImage(imageFile, "posts");
      }
      await createPost({
        authorId: user.uid,
        authorName: user.displayName,
        authorUsername: user.username,
        authorPhoto: user.photoURL,
        content: content.trim(),
        imageURL,
        tags: selectedTags,
        groupTags: selectedGroups,
        likes: [],
        visibility,
        createdAt: Date.now(),
      });
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedTags([]);
      setSelectedGroups([]);
      setVisibility("friends");
    } catch (err: any) {
      console.error("Failed to post:", err);
      setError(err?.message || "Failed to create post. Please try again.");
    }
    setPosting(false);
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl border border-blue-50 p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-600 font-semibold">
              {user.displayName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full resize-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm leading-relaxed min-h-[60px]"
            rows={3}
          />

          {imagePreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-100">
              <img src={imagePreview} alt="" className="w-full object-cover max-h-64" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                >
                  @{tag}
                  <button onClick={() => setSelectedTags((t) => t.filter((x) => x !== tag))}>
                    <HiXMark className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {selectedGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedGroups.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full"
                >
                  #{g}
                  <button onClick={() => setSelectedGroups((gs) => gs.filter((x) => x !== g))}>
                    <HiXMark className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => setVisibility("friends")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                visibility === "friends"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <HiUserCircle className="w-3.5 h-3.5" />
              Friends Only
            </button>
            <button
              type="button"
              onClick={() => setVisibility("global")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                visibility === "global"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <HiGlobeAlt className="w-3.5 h-3.5" />
              Global
            </button>
          </div>

          {error && (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-full hover:bg-blue-50 transition-colors text-blue-500"
              >
                <HiPhoto className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => { setShowTagPicker(!showTagPicker); setShowGroupPicker(false); }}
                  className="p-2 rounded-full hover:bg-blue-50 transition-colors text-blue-500"
                >
                  <HiUserPlus className="w-5 h-5" />
                </button>
                {showTagPicker && friends.length > 0 && (
                  <div className="absolute left-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-48 z-20 max-h-48 overflow-y-auto">
                    {friends.map((f) => (
                      <button
                        key={f.uid}
                        onClick={() => {
                          if (!selectedTags.includes(f.username)) {
                            setSelectedTags((t) => [...t, f.username]);
                          }
                          setShowTagPicker(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700"
                      >
                        @{f.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => { setShowGroupPicker(!showGroupPicker); setShowTagPicker(false); }}
                  className="p-2 rounded-full hover:bg-blue-50 transition-colors text-purple-500"
                >
                  <HiUserGroup className="w-5 h-5" />
                </button>
                {showGroupPicker && groups.length > 0 && (
                  <div className="absolute left-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-48 z-20 max-h-48 overflow-y-auto">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          if (!selectedGroups.includes(g.name)) {
                            setSelectedGroups((gs) => [...gs, g.name]);
                          }
                          setShowGroupPicker(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-gray-700"
                      >
                        #{g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handlePost}
              disabled={posting || (!content.trim() && !imageFile)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
