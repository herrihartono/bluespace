"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { updateUserProfile } from "@/lib/firestore";
import { uploadProfilePhoto } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { HiCamera, HiArrowLeft } from "react-icons/hi2";

export default function EditProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [division, setDivision] = useState(user?.division || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoURL = user.photoURL;
      if (photoFile) {
        photoURL = await uploadProfilePhoto(photoFile, user.uid);
      }
      const updates = {
        displayName,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        division,
        bio,
        photoURL,
      };
      await updateUserProfile(user.uid, updates);
      setUser({ ...user, ...updates });
      router.back();
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  if (!user) return null;

  const currentPhoto = photoPreview || user.photoURL;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-blue-50 transition-colors">
          <HiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
      </div>

      <div className="bg-white rounded-2xl border border-blue-50 p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 overflow-hidden">
              {currentPhoto ? (
                <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              <HiCamera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Username</label>
            <div className="flex items-center">
              <span className="px-3 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-400">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-r-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Division</label>
            <input
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="e.g. Engineering, Design, Marketing"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
