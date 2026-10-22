import React, { useState } from 'react'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import Navbar from '../components/shared/Navbar'
import Footer from '../components/shared/Footer'

const Contact = () => {
    const [sent, setSent] = useState(false)

    const submitHandler = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const subject = encodeURIComponent(`Rozgaar.com enquiry: ${data.get('subject')}`)
        const body = encodeURIComponent(`From: ${data.get('name')} (${data.get('email')})\n\n${data.get('message')}`)
        window.location.href = `mailto:contact@rozgaar.com?subject=${subject}&body=${body}`
        setSent(true)
    }

    return (
        <div className="job-portal-home info-page">
            <Navbar />
            <main className="info-page-main contact-page-main">
                <section className="contact-intro">
                    <h1>Contact us</h1>
                    <p>Have a question about finding a job or using Rozgaar.com? Send us a message and we’ll be glad to hear from you.</p>
                    <div className="contact-details">
                        <a href="mailto:contact@rozgaar.com"><Mail size={17} /> contact@rozgaar.com</a>
                        <span><Phone size={17} /> Reach us by email and we’ll get back to you.</span>
                        <span><MapPin size={17} /> India</span>
                    </div>
                </section>
                <form className="contact-form" onSubmit={submitHandler}>
                    <h2>Send a message</h2>
                    <label>Your name<input name="name" autoComplete="name" required /></label>
                    <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
                    <label>Subject<input name="subject" required /></label>
                    <label>Message<textarea name="message" rows="5" required /></label>
                    <button type="submit">{sent ? 'Open your email app' : 'Send message'} <ArrowRight size={16} /></button>
                    <small>Your email app will open with your message ready to send.</small>
                </form>
            </main>
            <Footer />
        </div>
    )
}

export default Contact
