
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DankeSchoenPage() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center text-center">
                <div className="space-y-6">
                    <h1 className="text-4xl font-bold text-white">
                        Danke schön! ✓
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Ihre Nachricht wurde erfolgreich übermittelt.
                    </p>
                    
                    <Link href="/">
                        <Button 
                            size="lg"
                            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Zurück
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
