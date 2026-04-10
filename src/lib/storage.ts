import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./firebase";
import { v4 as uuidv4 } from "uuid";

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${uuidv4()}.${ext}`;
  const storageRef = ref(getFirebaseStorage(), fileName);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadProfilePhoto(file: File, uid: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const storageRef = ref(getFirebaseStorage(), `profiles/${uid}.${ext}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
