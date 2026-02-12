"use client";

import React, { useRef, useState } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { X, Check, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperProps {
    image: string;
    onCrop: (croppedImage: string) => void;
    onCancel: () => void;
    aspectRatio?: number;
}

export default function ImageCropper({ image, onCrop, onCancel, aspectRatio = 1 }: ImageCropperProps) {
    const cropperRef = useRef<ReactCropperElement>(null);

    const handleCrop = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) {
            onCrop(cropper.getCroppedCanvas({
                width: 1000, // Reasonable high-res limit
                height: 1000,
            }).toDataURL("image/jpeg", 0.9));
        }
    };

    const rotate = () => {
        cropperRef.current?.cropper.rotate(90);
    };

    const zoomIn = () => {
        cropperRef.current?.cropper.zoom(0.1);
    };

    const zoomOut = () => {
        cropperRef.current?.cropper.zoom(-0.1);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 font-inter">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Crop Image</h3>
                        <p className="text-xs text-zinc-400 font-medium italic">Adjust your image for the perfect fit.</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-50 text-zinc-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper area */}
                <div className="p-8 bg-zinc-50">
                    <div className="rounded-2xl overflow-hidden border border-zinc-200">
                        <Cropper
                            src={image}
                            style={{ height: 400, width: "100%" }}
                            initialAspectRatio={aspectRatio}
                            aspectRatio={aspectRatio}
                            guides={true}
                            ref={cropperRef}
                            viewMode={1}
                            dragMode="move"
                            autoCropArea={1}
                            background={false}
                            responsive={true}
                            checkOrientation={false}
                        />
                    </div>

                    {/* Controls */}
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <button
                            onClick={rotate}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all text-zinc-600 shadow-sm"
                            title="Rotate 90°"
                        >
                            <RotateCw size={18} />
                        </button>
                        <button
                            onClick={zoomIn}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all text-zinc-600 shadow-sm"
                            title="Zoom In"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <button
                            onClick={zoomOut}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all text-zinc-600 shadow-sm"
                            title="Zoom Out"
                        >
                            <ZoomOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-zinc-100 flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 px-6 border border-zinc-100 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs hover:bg-zinc-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCrop}
                        className="flex-1 py-4 px-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-black/10"
                    >
                        <Check size={18} />
                        Apply Crop
                    </button>
                </div>
            </div>
        </div>
    );
}
