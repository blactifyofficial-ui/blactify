"use client";

import dynamic from "next/dynamic";
import React from 'react';

const Filters = dynamic(() => import("./Filters"), {
    ssr: false,
    loading: () => <div className="h-32 mb-6 animate-pulse bg-white/5 rounded-lg mt-8 hidden md:block" />
});

export default Filters;
