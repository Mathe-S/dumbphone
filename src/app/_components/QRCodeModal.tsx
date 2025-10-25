"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export function QRCodeModal({ url, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1e3a8a", // blue-900
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [url]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "dumbphone-qr-code.png";
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-blue-400/30 bg-linear-to-br from-blue-950 via-blue-900 to-blue-800 p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-blue-300 transition hover:bg-blue-800/50 hover:text-white"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            Share Your Canvas
          </h2>
          <p className="text-sm text-blue-200">
            Scan this QR code to let others suggest ideas
          </p>
        </div>

        {/* QR Code */}
        <div className="mb-6 flex justify-center">
          {qrDataUrl ? (
            <div className="rounded-xl border-4 border-blue-400/30 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="h-auto w-full"
                style={{ maxWidth: "300px" }}
              />
            </div>
          ) : (
            <div className="flex h-80 w-80 items-center justify-center rounded-xl border-4 border-blue-400/30 bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download QR Code
          </button>

          <div className="rounded-lg border border-blue-400/20 bg-blue-900/40 p-3">
            <p className="break-all text-xs text-blue-200">{url}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
