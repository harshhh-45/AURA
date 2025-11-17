'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import LoginOptions from '@/components/auth/LoginOptions';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-login');
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-6xl mx-auto">
        <Card className="overflow-hidden shadow-2xl backdrop-blur-sm bg-card/80">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary">
                Attendify QR
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                The smart, seamless, and secure way to manage attendance. Say
                goodbye to proxies and paperwork.
              </p>
              <div className="mt-8">
                <LoginOptions />
              </div>
            </div>
            <div className="relative hidden md:block">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={600}
                  height={600}
                  className="object-cover w-full h-full"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
       <footer className="py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Attendify QR. All rights reserved.</p>
        </footer>
    </main>
  );
}
