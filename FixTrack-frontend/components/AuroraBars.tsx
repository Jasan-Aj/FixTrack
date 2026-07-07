"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  SiNextdotjs,
  SiFastapi,
  SiPostgresql,
  SiLangchain,
  SiNeon,
} from "react-icons/si";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  ClipboardList,
  Cpu,
  UserCheck,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

interface AuroraBarsProps {
  className?: string;
}

export const AuroraBars = ({ className }: AuroraBarsProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const bars = [
    { height: "65%", opacity: 0.3 },
    { height: "50%", opacity: 0.4 },
    { height: "40%", opacity: 0.5 },
    { height: "30%", opacity: 0.6 },
    { height: "25%", opacity: 0.7 },
    { height: "20%", opacity: 0.8 },
    { height: "15%", opacity: 0.9 },
    { height: "20%", opacity: 0.8 },
    { height: "25%", opacity: 0.7 },
    { height: "30%", opacity: 0.6 },
    { height: "40%", opacity: 0.5 },
    { height: "50%", opacity: 0.4 },
    { height: "65%", opacity: 0.3 },
  ];

  return (
    <div
      className={cn(
        "relative w-full bg-white text-zinc-900 font-sans selection:bg-blue-500/30",
        className
      )}
    >
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="size-8 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <Image
              src="/logo1.png"
              alt="FixTrack"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          FixTrack
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
          <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">
            How It Works
          </a>
          <a href="#about" className="hover:text-zinc-900 transition-colors">
            About
          </a>
          <a href="#faq" className="hover:text-zinc-900 transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/login"
            className="hidden md:inline text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login?tab=register"
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-5 py-2 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="relative w-full min-h-screen z-0 overflow-hidden">
        <div className="absolute inset-0 flex items-end w-full h-full gap-0 justify-between pb-0 pointer-events-none">
          {bars.map((bar, index) => (
            <motion.div
              key={index}
              className="w-full rounded-t-sm bg-gradient-to-t from-blue-400 via-blue-400/60 to-transparent"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: bar.height, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: Math.abs(index - Math.floor(bars.length / 2)) * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/60 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center h-screen text-center px-4 pt-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-5xl leading-tight mt-16">
            Report Issues.{" "}
            <span className="text-blue-500">Get Resolved.</span>{" "}
            Instantly.
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
            AI-powered campus maintenance — report, resolve, repeat.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-[4.5rem]">
            <Link
              href="/login"
              className="flex items-center justify-start gap-3 bg-zinc-900 text-white py-2 rounded-full font-medium hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95"
              style={{ paddingLeft: "4px", paddingRight: "24px" }}
            >
              <div className="bg-white rounded-full p-2">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              Sign In to Dashboard
            </Link>
            <Link
              href="/login?tab=register"
              className="flex items-center gap-2 text-zinc-900 font-medium hover:text-zinc-600 transition-colors group"
            >
              Register as Student{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
            <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">
              Built with modern tech stack
            </p>
            <div className="flex flex-nowrap justify-center items-center gap-8 md:gap-16 text-zinc-900 w-full opacity-80">
              <div className="flex items-center gap-2 text-xl font-bold">
                <SiNextdotjs className="w-6 h-6" /> Next.js
              </div>
              <div className="flex items-center gap-2 text-xl font-bold">
                <SiFastapi className="w-6 h-6" /> FastAPI
              </div>
              <div className="flex items-center gap-2 text-xl font-bold">
                <SiPostgresql className="w-6 h-6" /> PostgreSQL
              </div>
              <div className="flex items-center gap-2 text-xl font-bold">
                <SiLangchain className="w-6 h-6" /> LangChain
              </div>
              <div className="flex items-center gap-2 text-xl font-bold">
                <SiNeon className="w-6 h-6" /> Neon
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        id="how-it-works"
        className="relative z-10 min-h-screen bg-white flex items-center py-24"
      >

          <div className="max-w-6xl mx-auto px-4 w-full">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
            <p className="text-zinc-500 text-center max-w-xl mx-auto mb-16">
              From reporting to resolution in four simple steps.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: ClipboardList,
                  title: "Submit Complaint",
                  description: "Student reports an issue with title, description, and photos.",
                },
                {
                  icon: Cpu,
                  title: "AI Classifies",
                  description: "AI automatically categorizes the issue and sets priority.",
                },
                {
                  icon: UserCheck,
                  title: "AI Assigns",
                  description: "Best-fit technician is assigned based on skills and availability.",
                },
                {
                  icon: CheckCircle2,
                  title: "Resolved",
                  description: "Technician fixes the issue and student provides feedback.",
                },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="size-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-5">
                    <step.icon className="size-8 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      <section id="about" className="relative z-20 py-32 px-4 overflow-hidden bg-zinc-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 text-left">
              <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6 shadow-sm border border-blue-200/50">
                Our Mission
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-zinc-900">
                Redefining Campus Maintenance
              </h2>
              <p className="text-zinc-600 text-lg leading-relaxed mb-6">
                FixTrack is an AI-powered hostel complaint management system designed for modern campuses. We streamline the entire maintenance workflow—from student submission to technician resolution—using intelligent automation.
              </p>
              <p className="text-zinc-500 leading-relaxed">
                We eliminate manual ticketing delays, ensuring issues reach the right people instantly, and keeping campuses running smoothly with data-driven insights.
              </p>
            </div>
            
            <div className="flex-1 w-full relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-[2rem] blur-2xl opacity-20 transform group-hover:opacity-30 group-hover:scale-105 transition-all duration-700" />
              <div className="relative bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-shadow duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 bg-white/60 rounded-2xl border border-zinc-100 shadow-sm hover:scale-105 hover:bg-blue-50/50 transition-all cursor-default">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-4 text-white font-bold shadow-md shadow-blue-500/20">1</div>
                    <h3 className="font-semibold text-zinc-900 mb-1">Instant Routing</h3>
                    <p className="text-sm text-zinc-500">AI connects issues to the right technician immediately.</p>
                  </div>
                  <div className="p-5 bg-white/60 rounded-2xl border border-zinc-100 shadow-sm hover:scale-105 hover:bg-blue-50/50 transition-all cursor-default">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center mb-4 text-white font-bold shadow-md shadow-cyan-500/20">2</div>
                    <h3 className="font-semibold text-zinc-900 mb-1">Smart Priority</h3>
                    <p className="text-sm text-zinc-500">Urgent problems are automatically escalated.</p>
                  </div>
                  <div className="p-5 bg-white/60 rounded-2xl border border-zinc-100 shadow-sm hover:scale-105 hover:bg-blue-50/50 transition-all cursor-default">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center mb-4 text-white font-bold shadow-md shadow-indigo-500/20">3</div>
                    <h3 className="font-semibold text-zinc-900 mb-1">Live Tracking</h3>
                    <p className="text-sm text-zinc-500">Students always know the status of their requests.</p>
                  </div>
                  <div className="p-5 bg-white/60 rounded-2xl border border-zinc-100 shadow-sm hover:scale-105 hover:bg-blue-50/50 transition-all cursor-default">
                    <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center mb-4 text-white font-bold shadow-md shadow-violet-500/20">4</div>
                    <h3 className="font-semibold text-zinc-900 mb-1">Data Insights</h3>
                    <p className="text-sm text-zinc-500">Admins see trends to prevent future issues.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-20 bg-white py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">FAQ</h2>
          <p className="text-zinc-500 text-center mb-16">Got questions? We&apos;ve got answers.</p>
          <div className="space-y-4">
            {[
              {
                q: "How do I submit a complaint?",
                a: "Log in to your student dashboard, click 'New Complaint', fill in the details, and submit. AI will handle the rest.",
              },
              {
                q: "How are technicians assigned?",
                a: "Our AI matches your issue to the most suitable technician based on their skills, workload, and location.",
              },
              {
                q: "Can I track my complaint status?",
                a: "Yes. Your dashboard shows real-time updates — from submission to resolution.",
              },
              {
                q: "What if my issue isn't resolved?",
                a: "You can provide feedback on resolved complaints, and admins can reassign issues if needed.",
              },
              {
                q: "Who can use FixTrack?",
                a: "FixTrack serves students, maintenance technicians, and campus administrators.",
              },
            ].map((faq, i) => (
              <div key={i} className="border border-zinc-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left font-medium hover:bg-zinc-50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown
                    className={`size-5 text-zinc-400 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-zinc-500 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-20 bg-white border-t border-zinc-200 py-8 px-4 text-center text-zinc-400 text-sm">
        &copy; {new Date().getFullYear()} FixTrack. All rights reserved.
      </footer>
    </div>
  );
};
