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
    localStorage.setItem('theme', theme ); 
  }, [theme]);
  return (
    <div className="themetoggle nav_ac" onClick={themetoggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? <MdWbSunny /> : <WiMoonAltWaningCrescent1 />}
    </div>
  );
};

export default Themetoggle;
