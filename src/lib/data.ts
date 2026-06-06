import { Game } from '@/types'

export async function getGames(): Promise<Game[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/games?select=*&order=name`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      next: { revalidate: 3600 },
    }
  )
  if (!res.ok) return []
  return res.json()
}
