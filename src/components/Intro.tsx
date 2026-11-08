import { useEffect, useState } from 'react'
import StrokeText from './React Bits Components/text/StrokeText'
import CameraIcon from './CameraIcon'

const FONT_STACK = '"Schibsted Grotesk", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const OUTRO_WORDS = ['Rent', 'the', 'gear']

const getFontSize = () => Math.min(Math.max(56, window.innerWidth * 0.12), 176)

function useIntroFontSize() {
  const [fontSize, setFontSize] = useState(getFontSize)

  useEffect(() => {
    const onResize = () => setFontSize(getFontSize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return fontSize
}

export default function Intro({ leaving }: { leaving: boolean }) {
  const fontSize = useIntroFontSize()

  return (
    <div
      aria-hidden="true"
      className={`intro fixed inset-0 z-50 flex select-none flex-col items-center justify-center overflow-hidden bg-ground px-6 text-center${
        leaving ? ' is-leaving' : ''
      }`}
    >
      <div className="intro-content relative w-full">
        <div className="intro-word relative flex flex-col items-center">
          <div className="absolute -top-10 sm:-top-12 animate-[introIcon_2.2s_cubic-bezier(0.16,1,0.3,1)_both] [will-change:transform,opacity]">
            <CameraIcon className="h-16 w-16 sm:h-22 sm:w-22 text-white/90 drop-shadow-[0_10px_25px_rgba(255,255,255,0.25)]" />
          </div>
          <StrokeText
            text="CriSells"
            strokeColor="#8f8a84"
            fillColor="#ffffff"
            strokeStyle="solid"
            strokeWidth={1.6}
            drawDuration={1}
            fillDelay={0.12}
            stagger={0.05}
            ease="power2.out"
            trigger="mount"
            fillMode="wipe"
            wipeFrom="left"
            fontSize={fontSize}
            fontWeight={800}
            letterSpacing={-0.055 * fontSize}
            fontFamily={FONT_STACK}
            shadow={false}
            marching={false}
            reverse={false}
          />
        </div>

        <p className="intro-outro pointer-events-none absolute inset-0 flex items-center justify-center gap-[0.24em] whitespace-nowrap px-6">
          {OUTRO_WORDS.map((word, index) => (
            <span key={word} className="intro-outro-word">
              <span style={{ animationDelay: `${1950 + index * 65}ms` }}>
                {word}
                {index === OUTRO_WORDS.length - 1 && <span className="text-[#ff00f7]">.</span>}
              </span>
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
