import { HopData } from "@/types/trace";
import { Globe, MapPin } from "lucide-react";
import { useMemo } from "react";
import worldMapImage from "@/assets/world-map.png";

interface WorldMapProps {
  hops: HopData[];
  compact?: boolean;
}

// Convert lat/lng to SVG coordinates (Equirectangular projection for image map)
const projectToSvg = (lat: number, lng: number, width: number, height: number) => {
  // Equirectangular projection (matches the image)
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y: Math.max(30, Math.min(height - 30, y)) };
};

const WorldMap = ({ hops, compact = false }: WorldMapProps) => {
  const width = 800;
  const height = compact ? 280 : 427;

  const hopsWithGeo = useMemo(() => 
    hops.filter(h => h.geo && h.status === "success"), 
    [hops]
  );

  const points = useMemo(() => 
    hopsWithGeo.map(hop => ({
      ...projectToSvg(hop.geo!.lat, hop.geo!.lng, width, height),
      hop,
    })),
    [hopsWithGeo]
  );

  return (
    <div className="cyber-panel p-2 glow-border h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-3 h-3 text-primary" />
        <span className="font-display text-[10px] tracking-wider text-primary uppercase">
          Global Route
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {hopsWithGeo.length} nodes
        </span>
      </div>

      <div className="relative bg-background/50 border border-border/50 rounded overflow-hidden flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="hsl(185 100% 50% / 0.06)"
                strokeWidth="0.5"
              />
            </pattern>
            
            {/* Glow filter */}
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Animated gradient for paths */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(185 100% 50% / 0.2)">
                <animate attributeName="stop-color" values="hsl(185 100% 50% / 0.2);hsl(185 100% 50% / 0.6);hsl(185 100% 50% / 0.2)" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="hsl(185 100% 50% / 0.8)">
                <animate attributeName="stop-color" values="hsl(185 100% 50% / 0.8);hsl(185 100% 50% / 1);hsl(185 100% 50% / 0.8)" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="hsl(185 100% 50% / 0.2)">
                <animate attributeName="stop-color" values="hsl(185 100% 50% / 0.2);hsl(185 100% 50% / 0.6);hsl(185 100% 50% / 0.2)" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>

            {/* Particle gradient */}
            <radialGradient id="particleGrad">
              <stop offset="0%" stopColor="hsl(185 100% 90%)" />
              <stop offset="50%" stopColor="hsl(185 100% 70%)" />
              <stop offset="100%" stopColor="hsl(185 100% 50% / 0)" />
            </radialGradient>

            {/* Continent fill gradient */}
            <linearGradient id="continentFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 100% 50% / 0.08)" />
              <stop offset="100%" stopColor="hsl(200 100% 45% / 0.04)" />
            </linearGradient>
          </defs>

          {/* World map background image */}
          <image 
            href={worldMapImage} 
            x="0" 
            y="0" 
            width={width} 
            height={height} 
            preserveAspectRatio="xMidYMid slice"
            opacity="0.9"
          />

          {/* Equator line */}
          <line 
            x1="0" y1={height / 2} 
            x2={width} y2={height / 2} 
            stroke="hsl(185 100% 50% / 0.1)" 
            strokeWidth="1" 
            strokeDasharray="8 4" 
          />
          
          {/* Prime meridian */}
          <line 
            x1={width / 2} y1="0" 
            x2={width / 2} y2={height} 
            stroke="hsl(185 100% 50% / 0.1)" 
            strokeWidth="1" 
            strokeDasharray="8 4" 
          />

          {/* Connection paths with animated particles */}
          {points.slice(0, -1).map((point, index) => {
            const nextPoint = points[index + 1];
            if (!nextPoint) return null;

            const pathId = `route-path-${index}`;
            const midX = (point.x + nextPoint.x) / 2;
            const midY = Math.min(point.y, nextPoint.y) - 40 - (index * 5);
            
            return (
              <g key={index}>
                {/* Path shadow */}
                <path
                  d={`M ${point.x} ${point.y} Q ${midX} ${midY} ${nextPoint.x} ${nextPoint.y}`}
                  fill="none"
                  stroke="hsl(185 100% 50% / 0.1)"
                  strokeWidth="6"
                  filter="url(#pathGlow)"
                />
                
                {/* Main path */}
                <path
                  id={pathId}
                  d={`M ${point.x} ${point.y} Q ${midX} ${midY} ${nextPoint.x} ${nextPoint.y}`}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Animated particles */}
                {[0, 1, 2, 3].map((particleIndex) => (
                  <circle
                    key={particleIndex}
                    r="5"
                    fill="url(#particleGrad)"
                    filter="url(#nodeGlow)"
                  >
                    <animateMotion
                      dur={`${2 + particleIndex * 0.4}s`}
                      repeatCount="indefinite"
                      begin={`${particleIndex * 0.5}s`}
                    >
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                ))}
              </g>
            );
          })}

          {/* Hop nodes */}
          {points.map((point, index) => {
            const isSource = index === 0;
            const isDestination = index === points.length - 1;
            const nodeColor = isSource 
              ? "hsl(165 100% 45%)" 
              : isDestination 
              ? "hsl(200 100% 45%)" 
              : "hsl(185 100% 50%)";
            
            return (
              <g key={point.hop.hop} filter="url(#nodeGlow)">
                {/* Outer pulse ring */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="18"
                  fill="none"
                  stroke={nodeColor}
                  strokeWidth="1"
                  opacity="0.4"
                >
                  <animate 
                    attributeName="r" 
                    values="12;22;12" 
                    dur="2s" 
                    repeatCount="indefinite"
                    begin={`${index * 0.2}s`}
                  />
                  <animate 
                    attributeName="opacity" 
                    values="0.4;0;0.4" 
                    dur="2s" 
                    repeatCount="indefinite"
                    begin={`${index * 0.2}s`}
                  />
                </circle>
                
                {/* Node background */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="hsl(220 25% 8%)"
                  stroke={nodeColor}
                  strokeWidth="2.5"
                />
                
                {/* Node inner glow */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={nodeColor}
                  opacity="0.3"
                />
                
                {/* Node number */}
                <text
                  x={point.x}
                  y={point.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={nodeColor}
                  fontFamily="Orbitron, sans-serif"
                >
                  {isSource ? "S" : isDestination ? "D" : point.hop.hop}
                </text>

                {/* Location label */}
                <g transform={`translate(${point.x}, ${point.y + 28})`}>
                  <rect
                    x="-50"
                    y="-10"
                    width="100"
                    height="20"
                    fill="hsl(220 25% 8% / 0.95)"
                    stroke={`${nodeColor}80`}
                    strokeWidth="1"
                    rx="3"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="9"
                    fill={nodeColor}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {point.hop.geo?.city || "Unknown"}
                  </text>
                </g>

                {/* Country code badge */}
                {point.hop.geo?.countryCode && (
                  <g transform={`translate(${point.x + 15}, ${point.y - 15})`}>
                    <rect
                      x="-12"
                      y="-8"
                      width="24"
                      height="16"
                      fill="hsl(220 25% 8%)"
                      stroke={nodeColor}
                      strokeWidth="1"
                      rx="2"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="bold"
                      fill={nodeColor}
                      fontFamily="Orbitron, sans-serif"
                    >
                      {point.hop.geo.countryCode}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* No data message */}
          {points.length === 0 && (
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              fontSize="14"
              fill="hsl(185 50% 45%)"
              fontFamily="JetBrains Mono, monospace"
            >
              Awaiting trace data...
            </text>
          )}
        </svg>

        {/* Map legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px] bg-background/90 px-3 py-2 rounded border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-accent bg-accent/20" />
            <span className="text-muted-foreground">Source</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-primary bg-primary/20" />
            <span className="text-muted-foreground">Hop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-secondary bg-secondary/20" />
            <span className="text-muted-foreground">Destination</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <span className="text-muted-foreground">Route</span>
          </div>
        </div>

        {/* Coordinates display */}
        <div className="absolute top-3 right-3 text-[10px] bg-background/90 px-2 py-1 rounded border border-border/50 font-mono text-muted-foreground">
          <span className="text-primary">LAT</span> 0° / <span className="text-primary">LNG</span> 0°
        </div>
      </div>

    </div>
  );
};

export default WorldMap;
