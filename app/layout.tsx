import type { Metadata } from "next";
import { ButtonSoundProvider } from "./button-sound-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "말해봄 | AI 영어 말하기",
    template: "%s | 말해봄",
  },
  description: "AI 친구와 함께하는 어린이 영어 말하기 학습",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body><ButtonSoundProvider/>{children}</body>
    </html>
  );
}
