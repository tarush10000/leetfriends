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
  MessageSquare,
  Crown,
  Building,
  Plus,
  Lock,
  Unlock
} from "lucide-react";
import Link from "next/link";
import TestimonialsCarousel from "@/components/Testimonials";

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
            <Link href="#pricing">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800/50"
              >
                Pricing
              </Button>
            </Link>
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl"></div>
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
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                excel
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From basic party creation to advanced AI insights, we've got all the tools to supercharge your coding journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Free Features */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Party System</h3>
                <p className="text-slate-400 mb-4">
                  Create and join coding parties with friends. Track progress together and compete in real-time challenges.
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Free tier: Up to 5 parties
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Progress Tracking</h3>
                <p className="text-slate-400 mb-4">
                  Automatic LeetCode stats sync, detailed progress analytics, and achievement tracking.
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Available in all tiers
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-6">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Live Challenges</h3>
                <p className="text-slate-400 mb-4">
                  Real-time coding challenges with timers, leaderboards, and instant feedback.
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Available in all tiers
                </div>
              </CardContent>
            </Card>

            {/* Premium Features */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Star className="w-5 h-5 text-purple-400" />
              </div>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">AI Insights</h3>
                <p className="text-slate-400 mb-4">
                  Personalized recommendations, problem difficulty suggestions, and performance analytics powered by AI.
                </p>
                <div className="flex items-center text-purple-400 text-sm">
                  <Lock className="w-4 h-4 mr-2" />
                  Silver tier and above
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mb-6">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Interview Prep</h3>
                <p className="text-slate-400 mb-4">
                  Company-specific questions, mock interviews, and curated problem sets for top tech companies.
                </p>
                <div className="flex items-center text-yellow-400 text-sm">
                  <Crown className="w-4 h-4 mr-2" />
                  Gold tier exclusive
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Game Master AI</h3>
                <p className="text-slate-400 mb-4">
                  AI-powered coding assistant that provides hints, debugging help, and algorithm guidance during challenges.
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Available in all tiers
                </div>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-slate-900/50 to-purple-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose your{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                adventure
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Start free and upgrade as you grow. Unlock advanced features and accelerate your coding journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="text-4xl font-bold text-white mb-4">
                  <span className="text-lg text-slate-400 mr-1">₹</span>0
                  <span className="text-lg text-slate-400">/mo</span>
                </div>
                <p className="text-slate-400 mb-6">Perfect for getting started</p>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Up to 5 parties</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Basic progress tracking</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Live challenges</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-slate-400">No AI insights</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-slate-400">No interview prep</span>
                  </div>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-slate-600 hover:bg-slate-700">
                    <Users className="w-4 h-4 mr-2" />
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Silver Tier */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 backdrop-blur-sm relative lg:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Most Popular
                </div>
              </div>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Silver</h3>
                <div className="text-4xl font-bold text-white mb-4">
                  <span className="text-lg text-slate-400 mr-1">₹</span>69.00
                  <span className="text-lg text-slate-400">/mo</span>
                </div>
                <p className="text-slate-400 mb-6">For serious competitive programmers</p>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Up to 15 parties</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">AI-powered insights</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-slate-400">No interview prep</span>
                  </div>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Silver
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Gold Tier */}
            <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Gold</h3>
                <div className="text-4xl font-bold text-white mb-4">
                  <span className="text-lg text-slate-400 mr-1">₹</span>169.00
                  <span className="text-lg text-slate-400">/mo</span>
                </div>
                <p className="text-slate-400 mb-6">Complete interview preparation</p>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Unlimited parties</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Full AI insights suite</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Interview preparation</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">Company-specific questions</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">24/7 priority support</span>
                  </div>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Gold
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-400 mb-4">All plans include a 7-day free trial</p>
            <Link href="/pricing">
              <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300">
                View Detailed Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
              level up
            </span>{" "}
            your coding?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join thousands of developers who are already improving their skills, landing dream jobs, and having fun while coding.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-8 py-4 text-lg rounded-xl backdrop-blur-sm"
              >
                <Crown className="w-5 h-5 mr-2" />
                View Pricing
              </Button>
            </Link>
          </div>

          <p className="text-slate-500 text-sm mt-8">
            No credit card required • 7-day free trial on paid plans
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Code2 className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                LeetFriends
              </span>
            </div>

            <div className="flex space-x-6 text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Support
              </Link>
              <Link href="/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center text-slate-500">
            <p>&copy; 2025 LeetFriends. All rights reserved.</p>
            <p className="mt-2 flex items-center justify-center">
              Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> by developers, for developers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}