import { useState, useRef, useCallback } from 'react'

export function useSSE() {
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)

  const startStream = useCallback(async (url, body, onTurn, onEnded, onError) => {
    setIsStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = await response.text()
        onError?.(err)
        setIsStreaming(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'turn') {
                onTurn?.(data)
              } else if (data.type === 'ended') {
                onEnded?.(data)
                setIsStreaming(false)
                return
              } else if (data.type === 'error') {
                onError?.(data.message)
                setIsStreaming(false)
                return
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError?.(err.message)
      }
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { isStreaming, startStream, stop }
}
