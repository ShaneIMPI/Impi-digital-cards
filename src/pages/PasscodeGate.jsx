import { useState } from 'react'
import { decryptToken } from '../cryptoUtils.js'
import { setToken, clearToken, verifyToken } from '../githubClient.js'
import { ENCRYPTED_GITHUB_TOKEN } from '../config.js'

export default function PasscodeGate({ onUnlocked }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setChecking(true)
    setError('')
    try {
      if (!ENCRYPTED_GITHUB_TOKEN) {
        throw new Error(
          'Passcode login hasn\u2019t been set up yet \u2014 see SETUP.md for the one-time setup step.'
        )
      }
      const token = await decryptToken(ENCRYPTED_GITHUB_TOKEN, passcode)
      setToken(token)
      await verifyToken()
      onUnlocked()
    } catch (err) {
      clearToken()
      setError(
        err.message === 'Incorrect passcode.'
          ? 'Incorrect passcode.'
          : err.message
      )
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-login-box">
        <h1 className="admin-title">IMPI Digital Cards — Designer access</h1>
        <p className="admin-subtitle">Enter your passcode to unlock editing.</p>
        <form onSubmit={handleSubmit} className="admin-form">
          <label className="admin-field">
            <span>Passcode</span>
            <input
              type="password"
              required
              autoComplete="off"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter your passcode"
            />
          </label>
          {error && <div className="admin-error">{error}</div>}
          <button type="submit" className="admin-btn-primary" disabled={checking}>
            {checking ? 'Checking…' : 'Unlock designer'}
          </button>
        </form>
      </div>
    </div>
  )
}
