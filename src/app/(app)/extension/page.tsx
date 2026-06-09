'use client'

import { useState, useEffect } from 'react'
import { Puzzle, Download, Check } from 'lucide-react'

const STEPS = [
  {
    num: 1,
    title: 'ZIP 다운로드',
    desc: '아래 버튼으로 익스텐션 파일을 다운로드하세요.',
  },
  {
    num: 2,
    title: 'ZIP 압축 해제',
    desc: '다운로드한 파일을 원하는 폴더에 압축 해제하세요.',
  },
  {
    num: 3,
    title: 'chrome://extensions 열기',
    desc: 'Chrome 주소창에 chrome://extensions 를 입력하고 이동하세요.',
    code: 'chrome://extensions',
  },
  {
    num: 4,
    title: '개발자 모드 켜기',
    desc: '우측 상단의 "개발자 모드" 토글을 켜세요.',
  },
  {
    num: 5,
    title: '폴더 로드',
    desc: '"압축 해제된 확장 프로그램을 로드합니다" 버튼을 클릭하고 압축 해제한 폴더를 선택하세요.',
  },
]

export default function ExtensionPage() {
  const [hasExt, setHasExt] = useState(false)

  useEffect(() => {
    setHasExt(document.documentElement.hasAttribute('data-wordledle-ext'))
  }, [])

  if (hasExt) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center px-4">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-green-500" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">설치되어 있어요!</h1>
        <p className="text-sm text-gray-500 mb-6">WORDLEDLE 익스텐션이 이미 설치되어 있습니다.<br />상단 바의 퍼즐 아이콘을 눌러 사이드바를 열어보세요.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
          <Puzzle size={22} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">WORDLEDLE 익스텐션</h1>
          <p className="text-sm text-gray-500">크롬 사이드바에서 결과를 빠르게 저장하세요</p>
        </div>
      </div>

      <div className="mt-6 mb-6">
        <a
          href="/wordledle-extension.zip"
          download
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gray-900 text-white font-black text-sm hover:bg-gray-700 transition-colors active:opacity-80"
        >
          <Download size={16} />
          익스텐션 다운로드
        </a>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map(step => (
          <div key={step.num} className="flex gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5">
            <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
              {step.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{step.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              {step.code && (
                <button
                  onClick={() => navigator.clipboard.writeText(step.code!)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {step.code}
                  <span className="text-[10px] text-gray-400 ml-1">복사</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
