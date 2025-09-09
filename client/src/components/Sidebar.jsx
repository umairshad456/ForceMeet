import React, { useState } from "react";
import { sidebarLinks } from "../constants/sidebarLinks";
import clsx from "clsx";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 🔹 Mobile toggle button */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-700 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 🔹 Sidebar */}
      <section
        className={clsx(
          "fixed top-14 left-0 h-[calc(100vh-64px)] bg-gray-700 text-white p-6 z-40 transform transition-transform duration-300 sm:static sm:translate-x-0 sm:w-[264px] sm:flex sm:flex-col sm:justify-between",
          {
            "-translate-x-full": !isOpen, // hidden on mobile
            "translate-x-0 w-64": isOpen, // visible on mobile
          }
        )}
      >

        <div className="flex flex-1 flex-col gap-2">
          {sidebarLinks.map((link) => {
            const isActive =
              link.route === "/"
                ? pathname === "/"
                : pathname === link.route ||
                pathname.startsWith(`${link.route}/`);

            return (
              <Link
                to={link.route}
                key={link.label}
                onClick={() => setIsOpen(false)} // close on click (mobile UX)
                className={clsx(
                  "flex gap-4 items-center p-3 rounded-lg transition-colors",
                  {
                    "bg-blue-500 text-white": isActive,
                    "hover:bg-gray-600": !isActive,
                  }
                )}
              >
                {link.imgURL && (
                  <img
                    src={link.imgURL}
                    alt={link.label}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default Sidebar;
