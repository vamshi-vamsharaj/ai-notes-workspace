// frontend/src/hooks/useAutosave.ts
import { useEffect, useRef, useCallback } from 'react'
import { useNotesStore } from '@/store/notesStore'
import { useDebounce } from './useDebounce'

interface AutosaveConfig {
  noteId: string
  title: string
  content: string
  delay?: number
}

export function useAutosave({ noteId, title, content, delay = 1200 }: AutosaveConfig) {
  const { updateNote } = useNotesStore()
  const debouncedTitle = useDebounce(title, delay)
  const debouncedContent = useDebounce(content, delay)
  const isFirstRender = useRef(true)
  const lastSaved = useRef({ title, content })

  const save = useCallback(async () => {
    const hasChanges =
      debouncedTitle !== lastSaved.current.title ||
      debouncedContent !== lastSaved.current.content

    if (!hasChanges) return

    try {
      await updateNote(noteId, { title: debouncedTitle, content: debouncedContent })
      lastSaved.current = { title: debouncedTitle, content: debouncedContent }
    } catch {
      // isSaving=false handled in store; surface via UI if needed
    }
  }, [debouncedTitle, debouncedContent, noteId, updateNote])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      lastSaved.current = { title, content }
      return
    }
    save()
  }, [debouncedTitle, debouncedContent]) // eslint-disable-line react-hooks/exhaustive-deps
}