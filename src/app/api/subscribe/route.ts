import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'src/data/subscribers.json');
    
    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    const subscribers = JSON.parse(fileData);

    // Check if already subscribed
    if (subscribers.includes(email)) {
      return NextResponse.json({ success: true, message: 'Already subscribed!' });
    }

    subscribers.push(email);
    fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2));

    return NextResponse.json({ success: true, message: 'Welcome to the inner circle!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
