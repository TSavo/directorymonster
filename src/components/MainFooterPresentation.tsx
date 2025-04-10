'use client';

import React from 'react';
import Link from 'next/link';
import { SiteInfo } from './hooks/useMainFooter';

export interface MainFooterPresentationProps {
  site: SiteInfo;
  currentYear: number;
  socialLinks: {
    name: string;
    url: string;
    ariaLabel: string;
    icon: string;
  }[];
  quickLinks: {
    name: string;
    href: string;
  }[];
  legalLinks: {
    name: string;
    href: string;
  }[];
  contactInfo: {
    type: 'email' | 'phone' | 'address';
    value: string;
    icon: string;
  }[];
}

/**
 * MainFooterPresentation Component
 *
 * Pure UI component for rendering the footer
 */
export function MainFooterPresentation({
  site,
  currentYear,
  socialLinks,
  quickLinks,
  legalLinks,
  contactInfo
}: MainFooterPresentationProps) {
  return (
    <footer className="bg-gradient-to-r from-primary-900 to-primary-950 text-white py-16" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Site Info */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-white">{site.name}</h3>
            <p className="text-neutral-300 mb-6">
              A comprehensive directory of products and services designed to help you find exactly what you're looking for.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="text-white hover:text-primary-200 transition-colors"
                  aria-label={social.ariaLabel}
                  data-testid={`social-link-${social.name.toLowerCase()}`}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-300 hover:text-white transition-colors focus-visible"
                    data-testid={`quick-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-300 hover:text-white transition-colors focus-visible"
                    data-testid={`legal-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3 text-neutral-300">
              {contactInfo.map((info) => (
                <li key={info.type} className="flex items-center" data-testid={`contact-${info.type}`}>
                  <svg className="h-5 w-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.icon} />
                  </svg>
                  <span>{info.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-800/50 mt-12 pt-8 text-center text-neutral-400">
          <p data-testid="copyright">© {currentYear} {site.name}. All rights reserved.</p>
          <p className="mt-2 text-sm">Powered by <span className="text-white font-medium">DirectoryMonster</span></p>
        </div>
      </div>
    </footer>
  );
}
