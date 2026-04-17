"use client"
import React, { useState } from 'react'
import { db } from '../../lib/firebase' // পাথ ঠিক আছে কি না চেক করে নিন
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Send, Loader2 } from 'lucide-react'

export default function OutreachPage() {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('Sending...')

    try {
      // ১. আপনার তৈরি করা সেই API Route-কে কল করা
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, subject, message }),
      })

      const data = await res.json()

      if (data.success) {
        // ২. ইমেইল সফলভাবে গেলে ফায়ারবেসে ডাটা সেভ হবে
        // এখন আর addDoc বা collection-এ লাল দাগ থাকবে না
        await addDoc(collection(db, "outreach_leads"), {
          email: email,
          originalMessageId: data.messageId, 
          subject: subject,
          open_count: 0,
          status: 'sent',
          createdAt: serverTimestamp(), // এখানেও লাল দাগ চলে যাবে
          lastFollowUp: null
        })

        setStatus('Success! Email sent and tracked in Firebase.')
        setEmail(''); setSubject(''); setMessage('');
      } else {
        setStatus('Failed to send email. Check API key.')
        console.log(data.error)
      }
    } catch (error) {
      console.error(error)
      setStatus('Error connecting to API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-10 bg-white shadow-xl rounded-2xl mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Send New Outreach</h1>
      <form onSubmit={handleSendEmail} className="space-y-4">
        <input 
          type="email" placeholder="Client Email" required
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="text" placeholder="Subject" required
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={subject} onChange={(e) => setSubject(e.target.value)}
        />
        <textarea 
          placeholder="Write your message here..." rows={6} required
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={message} onChange={(e) => setMessage(e.target.value)}
        />
        <button 
          type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
          Send Email
        </button>
        {status && <p className="mt-4 text-center font-medium text-blue-600">{status}</p>}
      </form>
    </div>
  )
}