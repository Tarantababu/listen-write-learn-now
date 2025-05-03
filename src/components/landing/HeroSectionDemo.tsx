
import React from "react";
import { HeroSection } from "@/components/ui/hero-section";
import { Icons } from "@/components/ui/icons";

export function HeroSectionDemo() {
  return (
    <HeroSection
      badge={{
        text: "Introducing our dictation tool",
        action: {
          text: "Learn more",
          href: "/signup",
        },
      }}
      title="Master languages through dictation"
      description="Train your ear, sharpen your memory, and improve your writing—all in one immersive experience."
      actions={[
        {
          text: "Get Started",
          href: "/signup",
          variant: "default",
        },
        {
          text: "Try a Sample",
          href: "#sample",
          variant: "glow",
        },
      ]}
      image={{
        light: "https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120",
        dark: "https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120",
        alt: "Dictation App Preview",
      }}
    />
  );
}
