import React from "react";
import { cn } from "@/lib/utils"; // If you have this utility

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    className?: string;
    maxHeight?: number | string;
};

export function ScrollArea({ 
    children, 
    className = "", 
    maxHeight = 400,
    ...props 
}: ScrollAreaProps) {
    return (
        <div
            className={cn(
                "overflow-auto rounded-md scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-slate-800",
                className
            )}
            style={{ 
                maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight 
            }}
            {...props}
        >
            {children}
        </div>
    );
}

export default ScrollArea;