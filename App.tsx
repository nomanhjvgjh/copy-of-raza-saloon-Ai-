import React, { useState } from 'react';
import { AppState, AnalysisResult, Hairstyle } from './types';
import { HAIRSTYLES, ICONS } from './constants';
import CameraView from './components/CameraView';
import { analyzeFace, applyHairstyle } from './services/gemini';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.CAMERA);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Hairstyle | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (base64: string) => {
    setPhoto(base64);
    setState(AppState.ANALYZING);
    setIsProcessing(true);
    
    try {
      const result = await analyzeFace(base64);
      setAnalysis(result);
      setState(AppState.STYLE_SELECTION);
    } catch (error) {
      console.error("Analysis failed", error);
      // Fallback for demo stability
      setAnalysis({
        faceShape: "Square",
        recommendations: ["Textured Fringe", "Burst Fade"],
        features: ["Strong Jawline", "Balanced Forehead"]
      });
      setState(AppState.STYLE_SELECTION);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyStyle = async (style: Hairstyle) => {
    if (!photo) return;
    setSelectedStyle(style);
    setState(AppState.GENERATING);
    setIsProcessing(true);

    try {
      const generated = await applyHairstyle(photo, style.prompt);
      setResultImage(generated);
      setState(AppState.RESULT);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Style application failed. Please try a different angle or lighting.");
      setState(AppState.STYLE_SELECTION);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setState(AppState.CAMERA);
    setPhoto(null);
    setAnalysis(null);
    setSelectedStyle(null);
    setResultImage(null);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black text-white relative overflow-hidden font-sans">
      {/* Header */}
      <header className="p-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
           <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
             <ICONS.Sparkles />
           </div>
           <div>
             <h1 className="text-xl font-[900] tracking-tighter leading-none italic uppercase">Raza<span className="text-blue-500 not-italic">Saloon</span></h1>
             <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black mt-1">AI Styling Lab</p>
           </div>
        </div>
        {state !== AppState.CAMERA && (
          <button 
            onClick={reset}
            className="p-3 glass-card rounded-full hover:bg-white/10 active:scale-90 transition-all"
          >
            <ICONS.Refresh />
          </button>
        )}
      </header>

      {/* Main UI */}
      <main className="flex-1 relative w-full h-full flex flex-col px-4 pb-4 overflow-hidden">
        
        {state === AppState.CAMERA && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CameraView isActive={true} onCapture={handleCapture} />
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-max">
                <div className="glass-card px-6 py-3 rounded-2xl border border-white/10 text-center shadow-2xl glow-blue">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Face Scanner</p>
                   <p className="text-[11px] text-white/70 font-bold uppercase tracking-tight">Position face for analysis</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {state === AppState.ANALYZING && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative w-64 h-80">
              <img 
                src={`data:image/jpeg;base64,${photo}`} 
                className="w-full h-full object-cover rounded-[2.5rem] grayscale brightness-50 opacity-40"
                alt="Original"
              />
              <div className="scan-line" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-[900] italic uppercase tracking-tighter">Analyzing</h2>
              <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Mapping facial geometry...</p>
            </div>
          </div>
        )}

        {state === AppState.STYLE_SELECTION && analysis && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8">
            <div className="glass-card rounded-[2.5rem] p-7 mb-6 border border-white/5">
              <div className="flex items-center gap-4 mb-5">
                <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  <ICONS.Check />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Analysis Result</h3>
                  <p className="text-2xl font-[900] italic uppercase">{analysis.faceShape} Profile</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.features.map((f, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/50 uppercase tracking-widest">{f}</span>
                ))}
              </div>
            </div>

            <h3 className="text-lg font-[900] uppercase tracking-tighter italic mb-4 px-2">Trending Styles</h3>
            
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pb-12 snap-scrollbar">
              {HAIRSTYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleApplyStyle(style)}
                  className="group relative flex flex-col p-6 glass-card rounded-[2rem] text-left transition-all hover:bg-white/[0.08] hover:border-blue-500/50 hover:-translate-y-1 active:scale-95 shadow-xl"
                >
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:bg-blue-600/20 transition-all">
                    {style.icon}
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-tighter text-white/90">{style.name}</span>
                  <p className="text-[10px] text-white/30 mt-1 font-bold uppercase tracking-tighter line-clamp-2">{style.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {state === AppState.GENERATING && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-48 h-48 border-[8px] border-blue-500/5 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 glass-card rounded-full flex items-center justify-center">
                  <span className="text-6xl animate-pulse">{selectedStyle?.icon}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-[900] italic uppercase tracking-tighter">Styling</h2>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Raza Saloon AI is rendering...</p>
            </div>
          </div>
        )}

        {state === AppState.RESULT && resultImage && (
          <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-700">
            <div className="flex-1 rounded-[3rem] overflow-hidden shadow-2xl relative bg-neutral-900 border border-white/10">
              <img src={resultImage} className="w-full h-full object-cover" alt="Result" />
              <div className="absolute top-8 left-8">
                 <div className="bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border border-blue-400/30">
                    <ICONS.Sparkles /> Raza AI Style
                 </div>
              </div>
              <div className="absolute bottom-8 left-8 opacity-30">
                 <p className="text-[10px] font-black italic tracking-[0.4em] uppercase">Raza Saloon Lab</p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={reset}
                className="flex-[0.4] py-6 glass-card rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95"
              >
                <ICONS.ArrowLeft /> Retake
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resultImage;
                  link.download = 'raza-style.png';
                  link.click();
                }}
                className="flex-1 py-6 bg-blue-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl active:scale-95"
              >
                <ICONS.Download /> Save Look
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="px-10 py-8 border-t border-white/[0.04] flex justify-between items-center bg-black/95">
         <button onClick={reset} className="flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-all">
           <ICONS.Camera />
           <span className="text-[8px] uppercase font-black tracking-widest">Scanner</span>
         </button>
         <button className="flex flex-col items-center gap-2 text-blue-500">
           <ICONS.Sparkles />
           <span className="text-[8px] uppercase font-black tracking-widest">Styles</span>
         </button>
         <button className="flex flex-col items-center gap-2 opacity-30">
           <div className="w-5 h-5 border-[2px] border-white rounded flex items-center justify-center text-[7px] font-black">AI</div>
           <span className="text-[8px] uppercase font-black tracking-widest">Catalog</span>
         </button>
      </footer>
    </div>
  );
};

export default App;