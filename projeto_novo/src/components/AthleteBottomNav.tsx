import React from "react";
import { Link, useLocation } from "react-router-dom";

const AthleteBottomNav: React.FC = () => {
  const { pathname } = useLocation();

  const cls = (to: string) =>
    `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
      pathname === to ? "text-[#00e87a]" : "text-[#6b7a99]"
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe z-50">
      <div className="flex">
        <Link to="/athlete/dashboard" className={cls("/athlete/dashboard")}>
          <span className="text-xl leading-none">🏠</span>Início
        </Link>
        <Link to="/athlete/feed" className={cls("/athlete/feed")}>
          <span className="text-xl leading-none">📰</span>Feed
        </Link>
        <Link to="/tournaments" className={cls("/tournaments")}>
          <span className="text-xl leading-none">🎾</span>Torneios
        </Link>
        <Link
          to="/athlete/profile"
          state={{ tab: "trophies" }}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#6b7a99] transition-colors"
        >
          <span className="text-xl leading-none">🏆</span>Troféus
        </Link>
        <Link to="/athlete/profile" className={cls("/athlete/profile")}>
          <span className="text-xl leading-none">👤</span>Perfil
        </Link>
      </div>
    </div>
  );
};

export default AthleteBottomNav;
