/**
 * Yonetici paneli arama motorlarina kapali.
 *
 * Denetimde bulundu (2026-08-24): panelin ne noindex etiketi ne de
 * robots.txt kaydi vardi. Adres tahmin edilmesi zor olsa da bu bir
 * guvenlik onlemi degil; bir kez indekslendiginde herkesin bulabilecegi
 * bir giris sayfasi olurdu. Sayfa "use client" oldugu icin metadata
 * disari veremiyor -- bu yuzden ayri bir layout.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
