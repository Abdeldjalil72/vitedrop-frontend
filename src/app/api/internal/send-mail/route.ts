import { NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function verifySecret(providedSecret: string | null, expectedSecret: string): boolean {
  if (!providedSecret) return false;
  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-mail-secret');
    const expectedSecret =
      process.env.INTERNAL_MAIL_SECRET || 'vd_internal_relay_9f8e7d6c5b4a3f2e1d0c';

    if (!verifySecret(authHeader, expectedSecret)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid internal mail secret' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { to, subject, html, text, from } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Missing required email fields (to, subject, html/text)' },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER || 'didomadridi25@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'bdwydftlrreccgil';
    const gmailPass = rawPass.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // Force IPv4 to prevent IPv6 DNS stalls on serverless
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    } as any);

    const defaultFrom = `"ViteDrop" <${gmailUser}>`;
    const info = await transporter.sendMail({
      from: from || defaultFrom,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('[Internal Mail Relay Error]', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'SMTP dispatch failed on Vercel relay',
      },
      { status: 502 }
    );
  }
}
