import { getGames } from '@/lib/data'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const games = await getGames()
  return <HomeClient initialGames={games} />
}
