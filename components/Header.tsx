"use client"

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Youtube, MessageCircle, Music, Users, LogOut, Settings, GamepadIcon } from 'lucide-react';

interface HeaderProps {
  onShowChat?: () => void;
  onShowAdminDashboard?: () => void;
}

export default function Header({ onShowChat, onShowAdminDashboard }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme, canToggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSocialLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GamepadIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                Sensi-Gen
              </h1>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => handleSocialLink('https://youtube.com/@firekidffx?si=xiM5a_ZRnk6ecSlM')}
              className="p-2 text-red-500 hover:text-red-600 transition-colors"
              title="YouTube Channel"
            >
              <Youtube className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleSocialLink('https://whatsapp.com/channel/0029VaT1YDxFsn0oKfK81n2R')}
              className="p-2 text-green-500 hover:text-green-600 transition-colors"
              title="WhatsApp Channel"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleSocialLink('https://www.tiktok.com/@firekid846?_t=ZM-8vTQwM6EpQz&_r=1')}
              className="p-2 text-pink-500 hover:text-pink-600 transition-colors"
              title="TikTok"
            >
              <Music className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleSocialLink('https://discord.gg/hJJx8x7T')}
              className="p-2 text-indigo-500 hover:text-indigo-600 transition-colors"
              title="Discord Support"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* World Chat Button */}
              {onShowChat && (
                <button
                  onClick={onShowChat}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="World Chat"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              )}

              {/* Theme Toggle (VIP only) */}
              {canToggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition-colors"
                  title="Toggle Theme"
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.role === 'admin' ? 'A' : user.role === 'vip' ? 'V' : 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.role.toUpperCase()}
                    </div>
                    {user.role === 'vip' && user.vipExpiresAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Expires: {new Date(user.vipExpiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Role: {user.role.toUpperCase()}
                        </div>
                        {user.role === 'user' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Weekly Generations: {user.weeklyGenerations}/1
                          </div>
                        )}
                        {user.role === 'vip' && user.vipExpiresAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            VIP until: {new Date(user.vipExpiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {user.role === 'admin' && onShowAdminDashboard && (
                        <button
                          onClick={() => {
                            onShowAdminDashboard();
                            setShowDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          signOut();
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
