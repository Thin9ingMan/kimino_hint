import { chromium } from '@playwright/test';
import fs from 'fs';

async function captureTimerScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  try {
    // Navigate to demo page
    await page.goto('http://localhost:8888/timer-demo.html');
    
    // Wait for initial render
    await page.waitForTimeout(1000);
    
    // Take first screenshot at start (timer = 10, blue)
    console.log('Capturing screenshot 1: Timer at start (10 seconds, blue)');
    const screenshot1 = await page.screenshot();
    fs.writeFileSync('/tmp/timer-start.png', screenshot1);
    console.log('Saved: /tmp/timer-start.png');
    
    // Wait for timer to reach 5-6 seconds (orange zone)
    console.log('Waiting for timer to reach orange zone (5-6 seconds)...');
    await page.waitForTimeout(4500); // Wait about 4.5 seconds so timer is at ~5-6 seconds
    
    // Take second screenshot
    console.log('Capturing screenshot 2: Timer counting down (5-6 seconds, orange)');
    const screenshot2 = await page.screenshot();
    fs.writeFileSync('/tmp/timer-countdown.png', screenshot2);
    console.log('Saved: /tmp/timer-countdown.png');
    
    console.log('\n✓ Screenshots captured successfully!');
    console.log('  - /tmp/timer-start.png (timer at start, ~10 seconds, blue color)');
    console.log('  - /tmp/timer-countdown.png (timer counting down, ~5-6 seconds, orange color)');
    
  } finally {
    await browser.close();
  }
}

captureTimerScreenshots().catch(console.error);
