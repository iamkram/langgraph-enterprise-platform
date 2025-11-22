import { Info } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DiagramHotspot as HotspotData } from "@shared/diagramHotspots";

interface DiagramHotspotProps {
  hotspot: HotspotData;
}

export function DiagramHotspot({ hotspot }: DiagramHotspotProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="absolute z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          style={{
            left: `${hotspot.position.x}%`,
            top: `${hotspot.position.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          aria-label={`View details for ${hotspot.label}`}
        >
          <Info className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="right" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-lg text-foreground">
              {hotspot.label}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {hotspot.description}
            </p>
          </div>

          {hotspot.technologies && hotspot.technologies.length > 0 && (
            <div>
              <h5 className="font-medium text-sm text-foreground mb-1">
                Technologies
              </h5>
              <div className="flex flex-wrap gap-1">
                {hotspot.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hotspot.keyFeatures && hotspot.keyFeatures.length > 0 && (
            <div>
              <h5 className="font-medium text-sm text-foreground mb-1">
                Key Features
              </h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {hotspot.keyFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
