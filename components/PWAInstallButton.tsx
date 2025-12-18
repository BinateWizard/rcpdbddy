'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt (for this session only)
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // On iOS, always show the button (since beforeinstallprompt doesn't fire)
    if (isIOSDevice) {
      setShowButton(true);
      return;
    }

    // For Android/Desktop - Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was just installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // For Android, also show button after a delay even if beforeinstallprompt hasn't fired
    // This helps in cases where the event is delayed
    const showTimeout = setTimeout(() => {
      if (!isIOSDevice) {
        setShowButton(true);
      }
    }, 2000);

    return () => {
      clearTimeout(showTimeout);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // iOS - show instructions modal
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Android/Desktop with deferred prompt
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowButton(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show a message if no prompt available
      alert('Para ma-install ang PadBuddy:\n\n1. I-tap ang menu button (⋮) sa browser\n2. Piliin ang "Install app" o "Add to Home screen"');
    }
  };

  const handleDismiss = () => {
    setShowButton(false);
    setIsDismissed(true);
    setShowIOSModal(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showButton || isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <div className="fixed top-4 left-4 right-4 z-[80] animate-slide-down lg:hidden">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-green-300 p-4 flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
              Install PadBuddy App
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {isIOS ? 'I-add sa Home Screen mo!' : 'I-install para mas mabilis!'}
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {isIOS ? <Plus className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {isIOS ? 'Add' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <>
          <div 
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-backdrop-fade"
            onClick={() => setShowIOSModal(false)}
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-modal-popup">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                  Install PadBuddy
                </h2>
                <p className="text-gray-600 text-sm">
                  Sundin ang mga steps na ito:
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      I-tap ang <Share className="inline h-4 w-4 text-blue-500" /> <strong>Share</strong> button sa baba ng Safari
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Mag-scroll down at piliin ang <strong>&quot;Add to Home Screen&quot;</strong>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      I-tap ang <strong>&quot;Add&quot;</strong> sa upper right corner
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
              >
                OK, Gets ko na!
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}


