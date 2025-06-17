'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Code2, Mail, MessageSquare, Phone, Send, User, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const form = e.target as HTMLFormElement;
            const formDataToSubmit = new FormData(form);
            
            const response = await fetch('https://formsubmit.co/tarushagarwal2003@gmail.com', {
                method: 'POST',
                body: formDataToSubmit
            });

            if (response.ok) {
                // Reset form on success
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                });
                alert('Message sent successfully! We\'ll get back to you soon.');
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again or contact us directly.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-slate-800/50 py-6 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <Code2 className="w-8 h-8 text-purple-400" />
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                            LeetFriends
                        </span>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Contact <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Us</span>
                        </h1>
                        <p className="text-xl text-slate-400">
                            We're here to help! Reach out with questions, feedback, or business inquiries.
                        </p>
                    </div>

                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center mb-8">
                                <MessageSquare className="w-8 h-8 text-purple-400 mr-3" />
                                <h2 className="text-2xl font-bold text-white">Send us a Message</h2>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Hidden fields for FormSubmit configuration */}
                                <input type="hidden" name="_subject" value="New message from LeetFriends Contact Form" />
                                <input type="hidden" name="_captcha" value="false" />
                                <input type="hidden" name="_template" value="table" />
                                <input type="hidden" name="_next" value="https://leetfriends.com/contact?success=true" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                                            <User className="w-4 h-4 inline mr-2" />
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter your email address"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-semibold text-white mb-2">
                                        <MessageCircle className="w-4 h-4 inline mr-2" />
                                        Subject *
                                    </label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="">Select a subject</option>
                                        <option value="General Support">General Support</option>
                                        <option value="Technical Issue">Technical Issue</option>
                                        <option value="Billing Question">Billing Question</option>
                                        <option value="Feature Request">Feature Request</option>
                                        <option value="Business Inquiry">Business Inquiry</option>
                                        <option value="Bug Report">Bug Report</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-white mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-vertical"
                                        placeholder="Tell us how we can help you..."
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 font-semibold"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                    
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 px-8 py-3"
                                        onClick={() => setFormData({ name: '', email: '', subject: '', message: '' })}
                                    >
                                        Clear Form
                                    </Button>
                                </div>

                                <div className="text-center">
                                    <p className="text-slate-400 text-sm">
                                        We typically respond within 24 hours. For urgent matters, please call us directly.
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Mail className="w-8 h-8 text-purple-400 mr-3" />
                                    <h2 className="text-xl font-bold text-white">Email Us</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-slate-300">tarushagarwal2003@gmail.com</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Phone className="w-8 h-8 text-purple-400 mr-3" />
                                    <h2 className="text-xl font-bold text-white">Phone Support</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-slate-300">+91 8630632030</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}