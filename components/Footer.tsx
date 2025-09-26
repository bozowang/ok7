/**
 * @fileoverview 應用程式的底部頁腳元件。
 */
import React from 'react';
import { APP_TITLE } from '../constants';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white text-center p-6 mt-12">
            <p>© {new Date().getFullYear()} {APP_TITLE}. 版權所有.</p>
        </footer>
    );
};

export default Footer;
