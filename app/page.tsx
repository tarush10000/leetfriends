import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LogIn,
  Github,
  Code2,
  Users,
  Trophy,
  Zap,
  ArrowRight,
  Target,
  Clock,
  Brain,
  Sparkles,
  CheckCircle,
  Star,
  TrendingUp,
  Shield,
  Rocket,
  Heart,
  Timer,
  BarChart3,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code2 className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
              LeetFriends
            </span>
          </div>

          <div className="flex gap-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 backdrop-blur-sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4 relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-extrabold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 text-transparent bg-clip-text">
                  LeetFriends
                </span>
              </h1>

              {/* Animated tagline */}
              <div className="text-2xl md:text-3xl text-slate-300 mb-4 font-medium">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  Maybe LeetCode was the friends we made along the way.
                </span>
              </div>
            </div>

            {/* Hero Description */}
            <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-4xl mx-auto leading-relaxed">
              Transform your solo coding grind into an epic multiplayer adventure. Create parties, compete with friends,
              and make LeetCode actually fun with <span className="text-purple-400 font-semibold">AI-powered challenges</span> and
              <span className="text-pink-400 font-semibold"> real-time competitions</span>.
            </p>

            {/* Stats Preview */}
            {/* <div className="flex flex-wrap justify-center gap-8 mb-12 text-sm">
              <div className="flex items-center text-slate-300">
                <Users className="w-5 h-5 mr-2 text-purple-400" />
                <span className="font-semibold text-white">1000+</span>&nbsp;Developers
              </div>
              <div className="flex items-center text-slate-300">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                <span className="font-semibold text-white">5000+</span>&nbsp;Challenges Completed
              </div>
              <div className="flex items-center text-slate-300">
                <Zap className="w-5 h-5 mr-2 text-green-400" />
                <span className="font-semibold text-white">50+</span>&nbsp;Active Parties
              </div>
            </div> */}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-4 text-lg font-semibold"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-600 bg-slate-800/30 hover:bg-slate-700/50 text-slate-300 backdrop-blur-sm px-8 py-4 text-lg font-semibold"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                Why Choose LeetFriends?
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              We've reimagined competitive programming to be social, engaging, and actually enjoyable.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 group flex flex-col items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Party Up</h3>
                <p className="text-slate-400 leading-relaxed text-center">
                  Create private coding parties with friends. Set member limits, passwords, and track everyone's progress in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 group flex flex-col items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">AI Game Master</h3>
                <p className="text-slate-400 leading-relaxed text-center">
                  Get personalized challenges, coding hints, and algorithm guidance from our intelligent AI assistant.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-yellow-500/50 transition-all duration-300 group flex flex-col items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Live Competitions</h3>
                <p className="text-slate-400 leading-relaxed text-center">
                  Race against friends with timed challenges, live leaderboards, and instant result tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300 group flex flex-col items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Progress Tracking</h3>
                <p className="text-slate-400 leading-relaxed text-center">
                  Automatic LeetCode sync, detailed analytics, and progress visualization to see your improvement over time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-pink-500/50 transition-all duration-300 group flex flex-col items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <Timer className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Timed Challenges</h3>
                <p className="text-slate-400 leading-relaxed text-center">
                  Create time-limited coding contests with automatic submission tracking and instant results.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-indigo-500/50 transition-all duration-300 group flex flex-col items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Secure & Private</h3>
                <p className="text-slate-400 leading-relaxed text-center">
                  Google & GitHub OAuth, password-protected parties, and secure data handling for your peace of mind.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-slate-400">
              Get started in minutes and transform your coding practice forever
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                {/* Hide connector line on last row or all rows for better look */}
                <div className="hidden"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Sign Up & Connect</h3>
              <p className="text-slate-400 leading-relaxed">
                Create your account with Google or GitHub, link your LeetCode profile, and set up your coding persona.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="hidden"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Create or Join Parties</h3>
              <p className="text-slate-400 leading-relaxed">
                Start your own coding party or join friends with a party code. Set challenges and compete together.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Code & Compete</h3>
              <p className="text-slate-400 leading-relaxed">
                Solve problems, compete in real-time, track progress, and celebrate victories with your coding friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Game Master Feature Highlight */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Sparkles className="w-8 h-8 text-purple-400 mr-3" />
                <span className="text-purple-400 font-semibold text-lg">AI-Powered</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Meet Your <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Game Master</span>
              </h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Our AI Game Master doesn't just give you problems—it creates personalized coding experiences,
                provides intelligent hints, and helps you grow as a programmer through guided challenges.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Smart Problem Selection</h4>
                    <p className="text-slate-400">Get problems tailored to your skill level and learning goals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Real-time Assistance</h4>
                    <p className="text-slate-400">Get hints and guidance when you're stuck, without spoiling the solution</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Competitive Challenges</h4>
                    <p className="text-slate-400">Create timed contests with automatic scoring and live leaderboards</p>
                  </div>
                </div>
              </div>

              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4"
                >
                  Try Game Master
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Game Master AI</h4>
                    <p className="text-slate-400 text-sm">Your personal coding coach</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-300 text-sm mb-2">💡 Challenge Ready!</p>
                    <p className="text-white">I've prepared a medium-difficulty array problem perfect for your skill level. Ready to compete with your party?</p>
                  </div>

                  <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
                    <p className="text-purple-300 text-sm mb-2">🎯 Live Challenge</p>
                    <p className="text-white">"Two Sum Variations" - 15 minutes remaining</p>
                    <div className="flex justify-between text-sm text-slate-300 mt-2">
                      <span>3 participants</span>
                      <span>2 completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
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

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "peer preshur frfr"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Samyak Jain</p>
                    <p className="text-slate-400 text-sm">Software Engineer @ Razorpay</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "Great stuff. Peer pressure that actually gets you placed"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">Y</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Yashvi Goyal</p>
                    <p className="text-slate-400 text-sm">Customer Success Manager @ IBM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "Made it to EY, but still scared of DP 😂 Shoutout to Leetfriend for the late-night grind and dumb bugs 💀🔥"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Smriti Singh</p>
                    <p className="text-slate-400 text-sm">Software Developer @ EY</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Make <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Coding Fun</span>?
            </h2>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Join thousands of developers who've transformed their coding practice into an engaging social experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-10 py-4 text-lg font-semibold"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="text-slate-400 text-sm mt-6">
              Free to join • No credit card required • Connect with Google or GitHub
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Code2 className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                LeetFriends
              </span>
            </div>

            <div className="flex items-center space-x-6 text-slate-400 text-sm">
              <span>Made with ❤️ for the coding community</span>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="https://github.com/tarush10000/leetfriends" className="hover:text-white transition-colors flex items-center">
                <Github className="w-4 h-4 mr-1" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}