
import React, { useState, useCallback, useMemo } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

// --- Helper Icon Components (defined outside App to prevent re-creation) ---

const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const Loader = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
        <p className="text-slate-400">AI is thinking...</p>
    </div>
);

// --- Main App Component ---

export default function App() {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const originalImagePreview = useMemo(() => {
    if (originalImageFile) {
      return URL.createObjectURL(originalImageFile);
    }
    return null;
  }, [originalImageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      setEditedImage(null);
      setError(null);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!originalImageFile) {
      setError("Please upload an image first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter an editing instruction.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const { base64, mimeType } = await fileToBase64(originalImageFile);
      const generatedImageBase64 = await editImageWithPrompt(base64, mimeType, prompt);
      setEditedImage(`data:${mimeType};base64,${generatedImageBase64}`);
    } catch (e) {
      const err = e as Error;
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [originalImageFile, prompt]);
  
  const examplePrompts = [
    "Remove the background",
    "Add a retro filter",
    "Make the colors more vibrant",
    "Convert to black and white",
    "Clean up the product photo",
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
          AI Photo Editor
        </h1>
        <p className="text-slate-400 mt-2">Edit your photos with simple text commands.</p>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 mb-32">
        {/* Original Image Panel */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">Original Image</h2>
          <div className="relative w-full aspect-square bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">
            {originalImagePreview ? (
              <img src={originalImagePreview} alt="Original upload" className="object-contain w-full h-full" />
            ) : (
              <div className="text-center text-slate-500">
                <PhotoIcon className="w-16 h-16 mx-auto" />
                <p className="mt-2">Upload an image to start</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload original image"
            />
          </div>
        </div>

        {/* Edited Image Panel */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">Edited Image</h2>
          <div className="w-full aspect-square bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden">
            {isLoading ? (
              <Loader />
            ) : editedImage ? (
              <img src={editedImage} alt="Edited result" className="object-contain w-full h-full" />
            ) : (
               <div className="text-center text-slate-500">
                <SparklesIcon className="w-16 h-16 mx-auto" />
                <p className="mt-2">Your edited image will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Control Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 p-4 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          {error && <div className="text-red-400 bg-red-900/50 p-2 rounded-md text-center mb-3 text-sm">{error}</div>}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Remove the background and make it high-resolution"
              className="w-full sm:flex-grow bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none transition resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !originalImageFile}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>{isLoading ? "Generating..." : "Generate"}</span>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {examplePrompts.map(p => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                disabled={isLoading}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
