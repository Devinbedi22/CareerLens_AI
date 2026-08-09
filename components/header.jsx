

import React from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  PenBox,
  StarsIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { checkUser } from "@/lib/checkUser";

const Header = async () => {
  await checkUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-black/20">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center pr-2 sm:pr-3">
          <Link href="/" className="-ml-1 flex items-center gap-[0.7rem] whitespace-nowrap transition duration-300 hover:opacity-100 sm:-ml-2">
            <div className="group relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/80 shadow-[0_0_0_1px_rgba(56,189,248,0.16)] transition-all duration-300 hover:border-cyan-300/40 hover:shadow-[0_0_16px_rgba(56,189,248,0.14)]">
              <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Image
                src="/nextstep-logo.svg"
                alt="NextStep AI logo"
                width={30}
                height={30}
                className="relative h-6 w-6 object-contain"
              />
            </div>
            <span className="hidden items-center whitespace-nowrap sm:inline-flex">
              <span className="text-[1.05rem] font-[600] leading-none text-white [font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif]">NextStep</span>
              <span className="ml-1 text-[1.05rem] font-[600] leading-none text-cyan-400 [font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif]">AI</span>
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link href="/#features" className="transition hover:text-cyan-300">Features</Link>
          <Link href="/#roadmap" className="transition hover:text-cyan-300">Roadmap</Link>
          <Link href="/#insights" className="transition hover:text-cyan-300">Insights</Link>
          <Link href="/#faq" className="transition hover:text-cyan-300">FAQ</Link>
        </div>

        <div className="flex items-center gap-3">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="hidden md:inline-flex">
                  <StarsIcon className="h-4 w-4" />
                  Growth tools
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/resume" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resume
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai-cover-letter" className="flex items-center gap-2">
                    <PenBox className="h-4 w-4" />
                    Cover Letter
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/interview" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Interview Prep
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button variant="outline" size="sm">Sign In</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
