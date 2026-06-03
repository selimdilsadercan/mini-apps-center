"use client";

import React from "react";
import Header from "./Header";
import Hero from "./sections/Hero";
import AppPreviewSection from "./sections/AppPreviewSection";
import FeaturesSection from "./sections/FeaturesSection";
import FAQ from "./sections/FAQ";
import Footer from "./Footer";

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#FAF9F7] text-gray-900 overflow-x-hidden antialiased">
      <Header />
      <main>
        <Hero />
        <AppPreviewSection />
        <FeaturesSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
