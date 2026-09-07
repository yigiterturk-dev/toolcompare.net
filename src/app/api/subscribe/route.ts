/**
 * Bulten kaydi.
 *
 * DENETIMDE BULUNAN (2026-08-24):
 *  - Hiz freni yoktu: uc herkese acik ve HER istekte diske yaziyor.
 *    Bir dongu hem dosyayi sinirsiz sisirir hem diski doldurur.
 *  - Dogrulama yalnizca "icinde @ var mi"ydi: uzunluk siniri yoktu,
 *    'A@b' ile 'a@b' iki ayri kayit oluyordu.
 *  - subscribers.json depoya commitlenmisti; abone e-postalari surum
 *    kontrolune girmemeli (.gitignore'a alindi).
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { hizFreni, istekKaynagi } from '@/lib/adminAuth';
import { guvenliYaz } from '@/lib/dosya';

const EPOSTA_SINIRI = 254; // RFC 5321'in pratik ust siniri
const EPOSTA_BICIMI = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!hizFreni(`abone:${istekKaynagi(request)}`, 5)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    const govde = await request.json();
    const ham = typeof govde?.email === 'string' ? govde.email.trim() : '';

    if (!ham || ham.length > EPOSTA_SINIRI || !EPOSTA_BICIMI.test(ham)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Kucuk harfe cevir: 'A@b.com' ile 'a@b.com' ayni kisi.
    const email = ham.toLowerCase();

    const filePath = path.join(process.cwd(), 'src/data/subscribers.json');
    if (!fs.existsSync(filePath)) {
      guvenliYaz(filePath, JSON.stringify([]));
    }

    let subscribers: string[] = [];
    try {
      subscribers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(subscribers)) subscribers = [];
    } catch {
      // Dosya bozuksa sifirdan baslamak, isteği reddetmekten iyi.
      subscribers = [];
    }

    if (subscribers.includes(email)) {
      return NextResponse.json({ success: true, message: 'Already subscribed!' });
    }

    subscribers.push(email);
    guvenliYaz(filePath, JSON.stringify(subscribers, null, 2));

    return NextResponse.json({ success: true, message: 'Welcome to the inner circle!' });
  } catch (error: unknown) {
    console.error('subscribe route error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
