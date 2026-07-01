import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export function uploadMedia(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `${folder}/${Date.now()}-${cleanName}`
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
      },
      (error) => reject(error),
      async () => {
        resolve(await getDownloadURL(task.snapshot.ref))
      },
    )
  })
}
