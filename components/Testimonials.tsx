"use client";
import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const TestimonialsCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const testimonials = [
        {
            id: 1,
            quote: "peer preshur frfr",
            name: "Samyak Jain",
            position: "Software Engineer @ Razorpay",
            avatar: "S",
            gradient: "from-purple-500 to-pink-500"
        },
        {
            id: 2,
            quote: "Great stuff. Peer pressure that actually gets you placed",
            name: "Yashvi Goyal",
            position: "Customer Success Manager @ IBM",
            avatar: "Y",
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            id: 3,
            quote: "Peer pressure + Leetfriend = EY 🤝💻 The grind was real, the bugs were ugly, but the hype kept us going 😭",
            name: "Smriti Singh",
            position: "Software Developer @ EY-GDS",
            avatar: "S",
            gradient: "from-green-500 to-emerald-500"
        },
        {
            id: 4,
            quote: "A platform that makes coding fun and interactive. My buddy that put me through my journey to NVIDIA",
            name: "Anisha",
            position: "QA Tester @ NVIDIA",
            avatar: "A",
            gradient: "from-red-500 to-orange-500"
        },
        {
            id: 5,
            quote: "The AI insights helped me identify my weak areas and focus my preparation. Got my dream job in just 3 months!",
            name: "Priya Sharma",
            position: "Backend Engineer @ Microsoft",
            avatar: "P",
            gradient: "from-indigo-500 to-purple-500"
        },
        {
            id: 6,
            quote: "Best coding practice platform I've used. The community support and party features make all the difference.",
            name: "Rohit Kumar",
            position: "DevOps Engineer @ Amazon",
            avatar: "R",
            gradient: "from-teal-500 to-blue-500"
        }
    ];

    const [visibleTestimonials, setVisibleTestimonials] = useState<typeof testimonials>([]);
    const [visibleCount, setVisibleCount] = useState(3);

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const maxIndex = testimonials.length - visibleCount - 1;
                return prevIndex >= maxIndex ? 0 : prevIndex + 1;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, testimonials.length, visibleCount]);

    const goToSlide = (index: number) => {
        const maxIndex = testimonials.length - visibleCount - 1;
        setCurrentIndex(Math.min(index, maxIndex));
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToNext = () => {
        const maxIndex = testimonials.length - visibleCount - 1;
        setCurrentIndex(currentIndex >= maxIndex ? 0 : currentIndex + 1);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToPrevious = () => {
        const maxIndex = testimonials.length - visibleCount - 1;
        setCurrentIndex(currentIndex === 0 ? maxIndex : currentIndex - 1);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    // Get visible testimonials based on screen size
    const getVisibleTestimonials = () => {
        const visibleCount = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
        const startIndex = currentIndex;
        const testimonialSlice = [];

        for (let i = 0; i < visibleCount; i++) {
            const index = (startIndex + i) % testimonials.length;
            testimonialSlice.push(testimonials[index]);
        }

        return testimonialSlice;
    };

    useEffect(() => {
        const handleResize = () => {
            const newVisibleCount = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
            setVisibleCount(newVisibleCount);
            setVisibleTestimonials(getVisibleTestimonials());
        };

        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [currentIndex]);

    type Testimonial = {
        id: number;
        quote: string;
        name: string;
        position: string;
        avatar: string;
        gradient: string;
    };

    interface TestimonialCardProps {
        testimonial: Testimonial;
        index: number;
    }

    const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, index }) => (
        <div
            className={`bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 transform hover:scale-102 flex-shrink-0 ${visibleCount === 3 ? 'w-full' : 'w-full'
                }`}
        >
            <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed min-h-[80px] flex items-center">
                "{testimonial.quote}"
            </p>
            <div className="flex items-center">
                <div className={`w-10 h-10 bg-gradient-to-r ${testimonial.gradient} rounded-full flex items-center justify-center mr-3`}>
                    <span className="text-white font-bold text-sm">{testimonial.avatar}</span>
                </div>
                <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-slate-400 text-sm">{testimonial.position}</p>
                </div>
            </div>
        </div>
    );

    return (
        <section className="py-20 px-4 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">
                            Loved by Developers
                        </span>
                    </h2>
                    <p className="text-xl text-slate-400">
                        See what our community has to say about their coding journey
                    </p>
                </div>

                <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                        onClick={goToPrevious}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-full p-3 transition-all duration-200 hover:scale-110 hidden md:flex items-center justify-center"
                        aria-label="Previous testimonials"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-300" />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-full p-3 transition-all duration-200 hover:scale-110 hidden md:flex items-center justify-center"
                        aria-label="Next testimonials"
                    >
                        <ChevronRight className="w-6 h-6 text-slate-300" />
                    </button>

                    {/* Testimonials Container */}
                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-in-out gap-8"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                                width: `${(testimonials.length * 100) / visibleCount}%`
                            }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={testimonial.id}
                                    className={`${visibleCount === 3 ? 'w-1/3' :
                                            visibleCount === 2 ? 'w-1/2' : 'w-full'
                                        } px-4 first:pl-0 last:pr-0`}
                                >
                                    <TestimonialCard testimonial={testimonial} index={index} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="flex justify-center space-x-4 mt-8 md:hidden">
                        <button
                            onClick={goToPrevious}
                            className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-full p-3 transition-all duration-200"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-300" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-full p-3 transition-all duration-200"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                    </div>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center space-x-2 mt-8">
                    {Array.from({ length: testimonials.length - visibleCount}, (_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 w-8'
                                    : 'bg-slate-600 hover:bg-slate-500'
                                }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsCarousel;