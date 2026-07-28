import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Footer() {
  const { user } = useAuth()

  return (
    <footer className="w-full py-10 sm:py-16 bg-surface-variant/40 border-t border-outline-variant">
      <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-10 gap-6 sm:gap-8 max-w-7xl mx-auto">
        {/* Brand + ISS */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link
            to={user ? '/app' : '/'}
            className="font-display text-2xl sm:text-3xl text-primary font-bold italic tracking-tight cursor-pointer no-underline"
          >
            AstroSutra AI
          </Link>
          <p className="text-[11px] sm:text-xs tracking-[0.12em] uppercase text-on-surface-variant">
            © 2026 AstroSutra AI. All Rights Reserved. Supported by{' '}
            <a
              href="https://manasai.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-bold"
            >
              manasai.tech
            </a>
          </p>
          <div className="mt-4 flex items-center gap-4 max-w-lg">
            <img
              src="https://issdelhi.org/wp-content/uploads/2025/04/ISS-LOGO-White-2048x1974.webp"
              alt="ISS Delhi Logo"
              className="w-18 h-18 object-contain shrink-0"
            />
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-bold text-primary tracking-wide uppercase">
                In Collaboration With
              </p>
              <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed font-medium">
                <strong>ISS</strong> (Institute for Science and Spirituality Trust)
                <br />
                An IKS Research Centre recognised by the IKS Division,
                <br />
                Ministry of Education, Govt of India
              </p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap justify-center gap-5 sm:gap-8">
          <Link
            to={user ? '/app' : '/'}
            className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase no-underline font-semibold"
          >
            {user ? 'Dashboard' : 'Home'}
          </Link>
          <Link
            to="/pricing"
            className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase no-underline font-semibold"
          >
            Pricing
          </Link>
          <Link
            to="/contact"
            className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase no-underline font-semibold"
          >
            Contact
          </Link>
          <Link
            to="/privacy"
            className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase no-underline"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-on-surface-variant hover:text-primary transition-colors text-[11px] sm:text-xs tracking-[0.12em] uppercase no-underline"
          >
            Terms
          </Link>
        </div>

        {/* Social icons */}
        <div className="flex gap-4 sm:gap-6">
          <a
            href="https://issdelhi.org"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 sm:w-10 sm:h-10 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white text-on-surface-variant transition-all cursor-pointer rounded-xl"
            title="Visit ISS website"
          >
            <span className="material-symbols-outlined text-sm">public</span>
          </a>
          <Link
            to="/contact"
            className="w-9 h-9 sm:w-10 sm:h-10 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white text-on-surface-variant transition-all cursor-pointer rounded-xl no-underline"
            title="Contact Us"
          >
            <span className="material-symbols-outlined text-sm">mail</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
