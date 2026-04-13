import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./firebase";
import { v4 as uuidv4 } from "uuid";
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from "@/types";

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, GIF, and WebP images are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }
  return null;
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${uuidv4()}.${ext}`;
  const storageRef = ref(getFirebaseStorage(), fileName);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadProfilePhoto(file: File, uid: string): Promise<string> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const ext = file.name.split(".").pop();
  const storageRef = ref(getFirebaseStorage(), `profiles/${uid}.${ext}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
