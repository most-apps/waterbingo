import type { ReactNode } from "react";
import { Link } from "react-router";
import mostLogo from "../assets/brand/most-logo.png";
import wepLogo from "../assets/brand/wep-logo.png";
import WaterDrop from "./WaterDrop";

export default function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Water Bingo home">
        <WaterDrop className="brand-drop" />
        <span className="brand-name">Water Bingo</span>
      </Link>
      <div className="partner">
        <img className="partner-most" src={mostLogo} alt="Museum of Science & Technology (MOST)" />
        <span className="partner-label">in partnership with</span>
        <img src={wepLogo} alt="Onondaga County Department of Water Environment Protection" />
      </div>
      {children && <nav className="toolbar">{children}</nav>}
    </header>
  );
}
