/**
 * @fileoverview 應用程式的頂部標頭元件。
 */
import React from 'react';
import { APP_TITLE } from '../constants';

interface HeaderProps {
    cartItemCount: number;
    onCartClick: () => void;
    onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemCount, onCartClick, onLogoClick }) => {
  return (
    <header className="bg-gradient-to-r from-red-500 to-orange-400 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold cursor-pointer" onClick={onLogoClick}>
          <i className="fas fa-utensils mr-2"></i> {APP_TITLE}
        </div>
        <button
          onClick={onCartClick}
          aria-label={`查看購物車，目前有 ${cartItemCount} 件商品`}
          className="relative bg-white/20 hover:bg-white/30 transition-colors duration-300 px-4 py-2 rounded-full flex items-center space-x-2"
        >
          <i className="fas fa-shopping-cart"></i>
          <span>購物車</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
