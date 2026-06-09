'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import { UserPlus, UserMinus, Pencil, Check, X, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { kstDaysAgo, kstToday } from '@/lib/date'
import { validateNickname } from '@/lib/validateNickname'
import GameStatCard, { buildGameStat, type GameStat } from '../_components/GameStatCard'
import DailyRecordRow, { type DailyRecord } from '../_components/DailyRecordRow'
import { computeUserTier } from '@/lib/tiers'
import { computeAchievements } from '@/lib/achievements'
import TierBadge from '@/components/TierBadge'
import TierInfoModal from '@/components/TierInfoModal'
import ActivityCalendar from '@/components/ActivityCalendar'
import AchievementGrid from '@/components/AchievementGrid'
import CompareModal from '@/components/CompareModal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function getRecentDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => kstDaysAgo(i))
}


export default function UserProfilePage() {
  const { nickname } = useParams<{ nickname: string }>()
  const { user: me, login: setMe } = useAuth()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [allResults, setAllResults] = useState<(GameResult & { game: Game })[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // 친구 상태
  const [isFriend, setIsFriend] = useState(false)
  const [friendLoading, setFriendLoading] = useState(false)

  // 닉네임 편집 (본인만)
  const [editingNick, setEditingNick] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [nickError, setNickError] = useState('')
  const [nickLoading, setNickLoading] = useState(false)
  const [showTierInfo, setShowTierInfo] = useState(false)
  const [showCompare, setShowCompare] = useState(false)

  const decodedNickname = decodeURIComponent(nickname)
  const isMe = me?.nickname === decodedNickname

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: userData }, { data: gamesData }] = await Promise.all([
        supabase.from('users').select('id, nickname, created_at').eq('nickname', decodedNickname).single(),
        supabase.from('games').select('*').order('name'),
      ])
      if (!userData) { setNotFound(true); setLoading(false); return }
      setProfileUser(userData as User)
      if (gamesData) setGames(gamesData as Game[])

      const { data: resultsData } = await supabase
        .from('results').select('*, game:games(*)')
        .eq('user_id', userData.id).order('date', { ascending: false })
      if (resultsData) setAllResults(resultsData as (GameResult & { game: Game })[])

      // 친구 여부 확인
      if (me && userData.id !== me.id) {
        const { data: friendData } = await supabase
          .from('friends').select('id').eq('user_id', me.id).eq('friend_id', userData.id).maybeSingle()
        setIsFriend(!!friendData)
      }

      setLoading(false)
    }
    load()
  }, [decodedNickname, me])

  const recentDates = getRecentDates(30)
  const byDate = new Map<string, (GameResult & { game: Game })[]>()
  for (const r of allResults) {
    if (!byDate.has(r.date)) byDate.set(r.date, [])
    byDate.get(r.date)!.push(r)
  }
  const dailyRecords: DailyRecord[] = recentDates
    .filter(d => byDate.has(d))
    .map(d => {
      const results = byDate.get(d)!
      return { date: d, results, completedCount: results.filter(r => r.completed).length, totalScore: results.reduce((s, r) => s + (r.score ?? 0), 0) }
    })

  const gameStats = games
    .map(game => buildGameStat(game, allResults, recentDates))
    .sort((a, b) => b.totalScore - a.totalScore)

  const today = kstToday()
  const todayCompleted = (byDate.get(today) ?? []).filter(r => r.completed).length
  const totalScore = gameStats.reduce((sum, s) => sum + s.totalScore, 0)
  const tier = computeUserTier(allResults.map(r => ({ date: r.date, score: r.score ?? 0 })))
  const achievements = computeAchievements(allResults, games.length)

  // 일평균 점수 계산
  const dailyScoreMap: Record<string, number> = {}
  for (const r of allResults) dailyScoreMap[r.date] = (dailyScoreMap[r.date] ?? 0) + (r.score ?? 0)
  const dailyScores = Object.values(dailyScoreMap)
  const activeDays = dailyScores.length
  const avgDailyScore = activeDays > 0
    ? Math.round(dailyScores.reduce((a, b) => a + b, 0) / activeDays * 10) / 10
    : 0

  async function handleAddFriend() {
    if (!me || !profileUser) return
    setFriendLoading(true)
    await createClient().from('friends').insert({ user_id: me.id, friend_id: profileUser.id })
    setIsFriend(true)
    setFriendLoading(false)
  }

  async function handleRemoveFriend() {
    if (!me || !profileUser) return
    setFriendLoading(true)
    await createClient().from('friends').delete().eq('user_id', me.id).eq('friend_id', profileUser.id)
    setIsFriend(false)
    setFriendLoading(false)
  }

  async function handleNicknameChange(e: FormEvent) {
    e.preventDefault()
    if (!me || !newNickname.trim()) return
    if (newNickname.trim() === me.nickname) { setEditingNick(false); return }
    const nickErr = validateNickname(newNickname)
    if (nickErr) { setNickError(nickErr); return }
    setNickLoading(true); setNickError('')
    const supabase = createClient()
    const { data: existing } = await supabase.from('users').select('id').eq('nickname', newNickname.trim()).single()
    if (existing) { setNickError('이미 사용 중인 닉네임입니다.'); setNickLoading(false); return }
    const { data, error } = await supabase.from('users').update({ nickname: newNickname.trim() }).eq('id', me.id).select('id, nickname, created_at').single()
    setNickLoading(false)
    if (error || !data) { setNickError('변경에 실패했습니다.'); return }
    setMe(data as typeof me)
    setEditingNick(false)
    // URL도 새 닉네임으로 교체
    window.history.replaceState(null, '', `/users/${encodeURIComponent(data.nickname)}`)
    setProfileUser(data as User)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto">
      <div className="h-32 rounded-2xl bg-gray-100 animate-pulse mb-5" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />)}
      </div>
    </div>
  )

  if (notFound) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <p className="text-4xl mb-3">🙈</p>
      <p className="text-lg font-black text-gray-900">유저를 찾을 수 없어요</p>
      <p className="text-sm text-gray-400 mt-1">@{decodedNickname}</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* 프로필 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* 닉네임 영역 */}
          <div className="flex-1 min-w-0">
            {isMe && editingNick ? (
              <form onSubmit={handleNicknameChange} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <input
                    value={newNickname}
                    onChange={e => { setNewNickname(e.target.value); setNickError('') }}
                    placeholder={me!.nickname}
                    autoFocus
                    className="text-2xl font-black bg-transparent border-b-2 border-gray-900 focus:outline-none w-36 pb-0.5"
                  />
                  <button type="submit" disabled={nickLoading}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-40">
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={() => { setEditingNick(false); setNickError('') }}
                    className="p-1 rounded-full text-gray-300 hover:text-gray-600 transition-colors">
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
                {nickError && <p className="text-xs text-red-500">{nickError}</p>}
              </form>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900">{profileUser?.nickname}</h1>
                {isMe && (
                  <>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">나</span>
                    <button
                      onClick={() => { setNewNickname(me!.nickname); setEditingNick(true) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setShowTierInfo(true)} className="cursor-pointer">
                <TierBadge tier={tier} size="sm" />
              </button>
              <p className="text-xs text-gray-400">
                {profileUser && new Date(profileUser.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 가입
              </p>
            </div>
          </div>

          {/* 오늘 완료 · 총점 · 일평균 */}
          <div className="flex gap-2">
            <div className="flex-1 sm:flex-none text-center bg-gray-50 rounded-2xl px-4 py-2.5">
              <p className="text-2xl font-black text-gray-900">
                {todayCompleted}<span className="text-base text-gray-300 font-bold">/{games.length}</span>
              </p>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">오늘 완료</p>
            </div>
            <div className="flex-1 sm:flex-none text-center bg-gray-50 rounded-2xl px-4 py-2.5">
              <p className="text-2xl font-black text-gray-900">{totalScore}</p>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">총 점수</p>
            </div>
            <div className="flex-1 sm:flex-none text-center bg-gray-50 rounded-2xl px-4 py-2.5">
              <p className="text-2xl font-black text-gray-900">{avgDailyScore}</p>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">일평균</p>
            </div>
          </div>
        </div>

        {/* 친구 버튼 + 비교 버튼 (타인 프로필 + 로그인 상태) */}
        {!isMe && me && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            {isFriend ? (
              <button
                onClick={handleRemoveFriend}
                disabled={friendLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-bold active:opacity-70 transition-opacity disabled:opacity-50"
              >
                <UserMinus size={15} />
                {friendLoading ? '처리 중...' : '친구 삭제'}
              </button>
            ) : (
              <button
                onClick={handleAddFriend}
                disabled={friendLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold active:opacity-70 transition-opacity disabled:opacity-50"
              >
                <UserPlus size={15} />
                {friendLoading ? '처리 중...' : '친구 추가'}
              </button>
            )}
            <button
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold active:opacity-70 transition-opacity"
            >
              <GitCompare size={15} />
              나와 비교
            </button>
          </div>
        )}
      </div>

      {/* 활동 캘린더 */}
      {allResults.length > 0 && (
        <section className="mb-5">
          <h2 className="text-lg font-black text-gray-900 mb-3">활동 기록</h2>
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
            <ActivityCalendar results={allResults.map(r => ({ date: r.date, score: r.score ?? 0 }))} />
          </div>
        </section>
      )}

      {/* 업적 */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-black text-gray-900">업적</h2>
          <span className="text-sm font-semibold text-gray-400">
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </span>
        </div>
        <AchievementGrid achievements={achievements} />
      </section>

      {/* 게임별 통계 */}
      {gameStats.some(s => s.totalPlayed > 0) && (
        <section className="mb-5">
          <h2 className="text-lg font-black text-gray-900 mb-3">게임별 통계</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-start">
            {gameStats.filter(s => s.totalPlayed > 0).map(stat => <GameStatCard key={stat.game.id} stat={stat} />)}
          </div>
        </section>
      )}

      {/* 날짜별 기록 */}
      <section>
        <h2 className="text-lg font-black text-gray-900 mb-3">최근 기록</h2>
        {dailyRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm font-semibold">아직 기록이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dailyRecords.map(record => (
              <DailyRecordRow key={record.date} record={record} games={games} isToday={record.date === today} />
            ))}
          </div>
        )}
      </section>

      <TierInfoModal open={showTierInfo} onClose={() => setShowTierInfo(false)} currentTier={tier} />

      {showCompare && me && profileUser && (
        <CompareModal
          me={me}
          other={profileUser}
          otherResults={allResults}
          games={games}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}


