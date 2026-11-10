'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    google?: any
    googleTranslateElementInit?: () => void
  }
}

export function GoogleTranslateScript() {
  useEffect(() => {
    // Define the global Google Translate callback
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,ml,ta,te',
            autoDisplay: false,
          },
          'google_translate_element',
        )
      }
    }

    // Inject Google Translate script if not already present in DOM
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.onerror = (e) => {
        // Silently handle offline/blocked network failure without uncaught console syntax errors
        console.warn('Google Translate script failed to load (offline or network restricted).')
      }
      document.body.appendChild(script)
    }
  }, [])

  return <div id="google_translate_element" className="hidden" aria-hidden="true" />
}
