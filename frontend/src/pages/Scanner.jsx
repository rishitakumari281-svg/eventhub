import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'

export default function Scanner() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const scannerRef = useRef(null)
  const processingRef = useRef(false)

  useEffect(() => {
    api.events.manageList()
      .then(list => setEvents(list))
      .catch(err => setError(err.message || 'Could not load events.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return

    let scanner
    let active = true

    async function startScanner() {
      try {
        scanner = new Html5Qrcode('eventhub-qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async decodedText => {
            if (processingRef.current || !active) return

            processingRef.current = true
            setMessage('Checking ticket...')
            setError('')

            try {
              const result = await api.registrations.scan(selected, decodedText.trim())
              setMessage(`${result.name} — ${result.message}`)
            } catch (err) {
              setMessage('')
              setError(err.message || 'Could not verify ticket.')
            }

            setTimeout(() => {
              processingRef.current = false
            }, 2500)
          },
          () => {}
        )
      } catch (err) {
        if (active) setError('Could not start camera. Allow camera access and use HTTPS or localhost.')
      }
    }

    startScanner()

    return () => {
      active = false
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => {
          scanner.clear().catch(() => {})
        })
      }
      scannerRef.current = null
      processingRef.current = false
    }
  }, [selected])


  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !selected) return

    setUploading(true)
    setMessage('Reading QR image...')
    setError('')

    const fileScanner = new Html5Qrcode('eventhub-qr-file-reader')

    try {
      const decodedText = await fileScanner.scanFile(file, false)
      await fileScanner.clear()

      setMessage('Checking ticket...')
      const result = await api.registrations.scan(selected, decodedText.trim())
      setMessage(`${result.name} — ${result.message}`)
    } catch (err) {
      setMessage('')
      setError(err.message || 'Could not read or verify this QR image.')
    } finally {
      try {
        await fileScanner.clear()
      } catch {}

      setUploading(false)
      e.target.value = ''
    }
  }

  if (user.role !== 'admin' && user.role !== 'organizer') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <section className="container section">
      <p className="eyebrow">EVENTHUB ATTENDANCE</p>
      <h1 className="display">QR <em>Scanner</em></h1>
      <p className="muted">Scan a participant's event ticket to mark attendance.</p>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <div className="field" style={{ maxWidth: 480, marginTop: 28 }}>
        <label htmlFor="scan-event">Select event</label>
        <select
          id="scan-event"
          value={selected}
          onChange={e => {
            setSelected(e.target.value)
            setMessage('')
            setError('')
          }}
        >
          <option value="">Choose an event</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : !events.length ? (
        <p className="muted">No managed events available.</p>
      ) : selected ? (
        <div style={{ maxWidth: 500, marginTop: 24 }}>
          <div id="eventhub-qr-reader" />
          <p className="muted">Position the participant's QR code inside the camera frame.</p>

          <div className="field" style={{ marginTop: 24 }}>
            <label htmlFor="qr-upload">Or upload a QR image</label>
            <input
              id="qr-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <p className="muted">Processing image...</p>}
          </div>

          <div id="eventhub-qr-file-reader" style={{ display: 'none' }} />
        </div>
      ) : (
        <p className="muted">Choose an event to activate the scanner.</p>
      )}
    </section>
  )
}
