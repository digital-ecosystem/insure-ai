"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { useConversation } from "@11labs/react";
import SimpleVisualizer from "./SimpleVisualizer";

export function ConvAI() {
  const [audioFreq, setAudioFreq] = React.useState<number>(0.1);
  const [name, setName] = React.useState<string>("");
  const [number, setNumber] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [analyser, setAnalyser] = React.useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isStopped, setIsStopped] = React.useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = React.useState<HTMLAudioElement | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("connected");
    },
    onDisconnect: () => {
      console.log("disconnected");
    },
    onError: error => {
      console.log(error);
      alert("An error occurred during the conversation");
    },
    onMessage: message => {
      console.log(message);
    },

  });

  // Continuous frequency analysis for audio playback
  React.useEffect(() => {
    let isLoaded = true;
    let lastValidFreq = 0.1;

    const render = async () => {
      if (isLoaded && analyser && isPlaying) {
        // Create frequency data array
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Get frequency data from analyser
        analyser.getByteFrequencyData(dataArray);

        // Calculate average frequency
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] / 255.0;
        }
        const avgFreq = sum / dataArray.length;

        if (avgFreq > 0.01) {
          lastValidFreq = Math.max(avgFreq * 1.0, 0.1); // Reduced amplification for subtler animation
          setAudioFreq(lastValidFreq);
        } else {
          // Gradually decay towards baseline
          lastValidFreq = Math.max(lastValidFreq * 0.95, 0.1);
          setAudioFreq(lastValidFreq);
        }
      } else {
        // Gradually decay when no audio
        lastValidFreq = Math.max(lastValidFreq * 0.98, 0.1);
        setAudioFreq(lastValidFreq);
      }

      if (isLoaded) {
        requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isLoaded = false;
    };
  }, [analyser, isPlaying]);

  async function playAudio() {
    try {
      setIsStopped(false);
      const audioPath = "/renate-insureAI.mp3";
      const audio = new Audio(audioPath);
      
      // Store audio reference for stopping later
      setCurrentAudio(audio);
      
      // Create audio context and analyser
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      const source = context.createMediaElementSource(audio);
      const analyzer = context.createAnalyser();
      
      // Configure analyser
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;
      
      // Connect audio nodes
      source.connect(analyzer);
      analyzer.connect(context.destination);
      
      // Set up state
      setAnalyser(analyzer);
      setIsPlaying(true);
      
      // Handle audio events
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setIsStopped(false);
        setAudioFreq(0.1);
        setCurrentAudio(null);
      });
      
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });
      
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsStopped(false);
      });
      
      // Start playing
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, number }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Optionally handle response data
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      window.location.href = '/danke-schoen';
      // Reset form on success
      setName("");
      setNumber("");
    } catch (error) {
      console.error('Form submission error:', error);
      setError("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      // Keep the audio reference so we can continue from the same position
    }
    setIsPlaying(false);
    setIsStopped(true);
    setAudioFreq(0.1);
  }

  function continueAudio() {
    if (currentAudio) {
      currentAudio.play();
      setIsPlaying(true);
      setIsStopped(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative">
      {/* Ball - keeping the same position and functionality */}
      <div className="fixed left-[50%] transform -translate-x-1/2 z-10 top-[20%] md:top-[25%]">
        <SimpleVisualizer AudioFreq={audioFreq} width={400} height={400} />
      </div>

      {/* Spacer to push content below the ball */}
      <div className="h-[50vh] sm:h-[60vh] md:h-[65vh] w-full"></div>

      {/* Main content container - positioned below the ball */}
      <div className="w-full max-w-md flex flex-col items-center space-y-8 relative z-20">
        
        {/* Audio Controls */}
        <div className="flex gap-4">
          <Button
            variant={"outline"}
            className="rounded-full px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 hover:scale-105"
            size={"lg"}
            disabled={isPlaying === true}
            onClick={playAudio}
          >
            ▶ Start
          </Button>
          <Button
            variant={"outline"}
            className={`rounded-full px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-2 hover:scale-105 ${
              isStopped 
                ? 'bg-green-500/90 hover:bg-green-600/90 text-white border-green-400' 
                : 'bg-red-500/90 hover:bg-red-600/90 text-white border-red-400'
            }`}
            size={"lg"}
            disabled={conversation === null || !currentAudio}
            onClick={isStopped ? continueAudio : stopAudio}
          >
            {isStopped ? '▶ Continue' : '⏸ Stop'}
          </Button>
        </div>

        {/* Elegant Form */}
        <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Kontaktiere Uns
            </h2>
            <p className="text-gray-600 text-sm">
              Hinterlasse deine Kontaktdaten und wir melden uns bei dir
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dein Name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                  required
                />
              </div>
              
              <div className="relative">
                <input
                  type="tel"
                  id="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Deine Telefonnummer"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Senden...
                </div>
              ) : (
                "Absenden"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
