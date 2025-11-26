"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import SvgSidebar from "@/icons/sidebar";
import AppSidebar from "@/sections/sidebar/AppSidebar";
import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import IconButton from "@/refresh-components/buttons/IconButton";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Close sidebar when route changes (pathname or search params change)
  useEffect(() => {
    setOpen(false);
  }, [searchParams, pathname]);

  return (
    <div className="md:hidden flex items-center py-2 px-4 border-b bg-background-tint-02 pt-[env(safe-area-inset-top)]">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div>
            <IconButton icon={SvgSidebar} tertiary className="-ml-2" />
          </div>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 w-[80%] max-w-[300px] border-r-0"
          hideCloseButton
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <AppSidebar className="w-full h-full" isMobile />
        </SheetContent>
      </Sheet>
    </div>
  );
}
