'use client'

import { useRef } from 'react'

// A Foto/Video toggle shares one URL field between two very different
// values (an uploaded photo vs. a video link), so naively clearing that
// field on every switch loses whatever was already entered the moment the
// user taps back and forth. This remembers the last value seen for each
// type — every render syncs the current type's slot, so switching back
// restores exactly what was there before, while a type never visited yet
// still starts blank.
export function useMediaTypeDrafts(type: 'image' | 'video' | undefined, value: string) {
  const drafts = useRef({ image: '', video: '' })
  drafts.current[type ?? 'image'] = value

  return (nextType: 'image' | 'video') => drafts.current[nextType]
}
