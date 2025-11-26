"use client";

import { useSettingsContext } from "@/components/settings/SettingsProvider";
import { cn, transformLinkUri } from "@/lib/utils";
import { FOLDED_SIZE } from "@/refresh-components/Logo";
import { useAppFocus } from "@/lib/hooks";
import IconButton from "@/refresh-components/buttons/IconButton";
import SvgShare from "@/icons/share";
import SvgSidebar from "@/icons/sidebar";
import { useChatContext } from "@/refresh-components/contexts/ChatContext";
import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import ShareChatSessionModal from "@/app/chat/components/modal/ShareChatSessionModal";
import Text from "@/refresh-components/texts/Text";
import ReactMarkdown from "react-markdown";
import AppSidebar from "@/sections/sidebar/AppSidebar";

export default function AppLayout({
  className,
  children,
  ...rest
}: React.HtmlHTMLAttributes<HTMLDivElement>) {
  const settings = useSettingsContext();
  const customHeaderContent =
    settings.enterpriseSettings?.custom_header_content;
  const customFooterContent =
    settings.enterpriseSettings?.custom_lower_disclaimer_content;
  const customLogo = settings.enterpriseSettings?.use_custom_logo;
  const customLogotype = settings.enterpriseSettings?.use_custom_logotype;
  // UCSD Patch
  // Two lines for chat header setting
  const twoLinesForHeader =
    settings.enterpriseSettings?.two_lines_for_chat_header;
  // End UCSD Patch

  const appFocus = useAppFocus();
  const { chatSessions } = useChatContext();
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Close sidebar when route changes (pathname or search params change)
  useEffect(() => {
    setSidebarOpen(false);
  }, [searchParams, pathname]);

  const currentChatSession =
    typeof appFocus === "object" && appFocus.type === "chat"
      ? chatSessions.find((session) => session.id === appFocus.id)
      : undefined;

  const SHOW_CUSTOM_LOGO = false;

  return (
    <>
      {showShareModal && currentChatSession && (
        <ShareChatSessionModal
          chatSession={currentChatSession}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Mobile Sidebar - Always mounted but hidden */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/80 transition-opacity duration-300",
            sidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[80%] max-w-[300px] bg-background shadow-lg transition-transform duration-300 ease-in-out pt-[env(safe-area-inset-top)]",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <AppSidebar
            className="w-full h-full"
            isMobile
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      <div className="flex flex-col h-screen w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Header */}
        <header className="w-full flex flex-row justify-between items-center py-2 md:py-3 px-2 md:px-4 gap-2 flex-shrink-0">
          {/* Mobile Sidebar Button - always show on mobile */}
          <div className="md:hidden flex-shrink-0">
            <IconButton
              icon={SvgSidebar}
              tertiary
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>

          {/* UCSD Patch - Two lines for chat header */}
          <div
            className={cn(
              "flex-1 flex items-center justify-center min-w-0 overflow-hidden",
              twoLinesForHeader ? "flex-col" : "flex-row"
            )}
          >
            {customHeaderContent ? (
              <ReactMarkdown
                className={cn(
                  "prose dark:prose-invert max-w-full text-xs md:text-sm text-center text-text-03",
                  !twoLinesForHeader &&
                    "[&_p]:inline md:[&_p]:whitespace-nowrap"
                )}
                urlTransform={transformLinkUri}
              >
                {customHeaderContent}
              </ReactMarkdown>
            ) : null}
          </div>
          {/* End UCSD Patch */}

          {/* Share button - only show when there's a chat session */}
          {currentChatSession && (
            <div className="flex-shrink-0">
              <IconButton
                icon={SvgShare}
                transient={showShareModal}
                tertiary
                onClick={() => setShowShareModal(true)}
              />
            </div>
          )}
        </header>

        <div
          className={cn("flex-1 overflow-auto min-h-0", className)}
          {...rest}
        >
          {children}
        </div>

        {(customLogo || customFooterContent || customLogotype) && (
          <footer className="w-full flex flex-col justify-center items-center gap-1 md:gap-2 py-1 md:py-3 relative flex-shrink-0">
            {customLogotype && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden xl:block">
                <img
                  src="/api/enterprise-settings/logotype"
                  alt="logotype"
                  style={{ objectFit: "contain" }}
                  width={125}
                  height={125}
                />
              </div>
            )}
            <div className="w-[95%] mx-auto max-w-[50rem]">
              <div className="flex flex-row justify-center items-center gap-2">
                {SHOW_CUSTOM_LOGO && customLogo && (
                  <img
                    src="/api/enterprise-settings/logo"
                    alt="Logo"
                    style={{
                      objectFit: "contain",
                      height: FOLDED_SIZE,
                      width: FOLDED_SIZE,
                    }}
                    className="flex-shrink-0"
                  />
                )}
              </div>
              {customFooterContent && (
                <ReactMarkdown
                  className="prose dark:prose-invert max-w-full text-xs md:text-sm text-center text-text-03 leading-tight"
                  urlTransform={transformLinkUri}
                >
                  {customFooterContent}
                </ReactMarkdown>
              )}
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
