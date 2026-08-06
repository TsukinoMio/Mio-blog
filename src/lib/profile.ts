import profileData from '@/data/profile.json';

/** About 页的数据。结构与 music.json 一致：先走本地 JSON，将来换成接口只改这里 */

export interface Profile {
  avatar: string;
  intro: string[];
}

export async function getProfile(): Promise<Profile> {
  return profileData as Profile;
}
