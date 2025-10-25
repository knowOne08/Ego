import React, { useEffect, useState } from "react";
import { WiMoonAltWaningCrescent1 } from "react-icons/wi";
import { MdWbSunny } from "react-icons/md";


const Themetoggle = () => {
  const [theme, settheme] = useState(localStorage.getItem("theme") || "dark");
  
  const themetoggle = () => {
    settheme(theme === "dark" ? "light" : "dark");
  };
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }));
  }, [theme]);

  // Listen for theme changes from other components (like blog post)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        settheme(e.newValue || 'dark');
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom theme change events within the same window
    const handleThemeChange = (e) => {
      settheme(e.detail.theme);
    };
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return (
    <div className="themetoggle nav_ac" onClick={themetoggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? <MdWbSunny /> : <WiMoonAltWaningCrescent1 />}
    </div>
  );
};

export default Themetoggle;
