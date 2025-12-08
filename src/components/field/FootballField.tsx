/**
 * Renders a college-specification American football field
 * with accurate dimensions and markings.
 *
 * Field specs:
 * - 160 feet wide
 * - Hash marks 60 feet from each edge (40 feet between hashes)
 * - 3 feet between hash marks (1 yard)
 * - Bottom-anchored rendering with y=0 at bottom
 * - Line of scrimmage at y=30 feet (darker line)
 * - Responsive scale based on available width
 * 
 * Coordinate System:
 * - Storage: Feet with origin at bottom-left (0,0)
 * - Rendering: Web pixels with origin at top-left (0,0)
 * - Conversion handles the Y-axis flip
 */

import { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FIELD_WIDTH_FEET,
  HASH_SPACING,
  LINE_OF_SCRIMMAGE,
  LEFT_HASH_CENTER,
  RIGHT_HASH_CENTER,
  HASH_WIDTH,
  NUMBER_HEIGHT,
  NUMBER_FROM_EDGE,
} from '../../constants/field.constants';

interface FootballFieldProps {
  className?: string;
  onDimensionsChange?: (width: number, height: number) => void;
}

export function FootballField({ className, onDimensionsChange }: FootballFieldProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Theme-aware colors
  const fieldBg = theme === 'dark' ? '#1f2937' : '#f2f2f2';
  const lineColor = theme === 'dark' ? '#4b5563' : '#a9a9a9';
  const losLineColor = theme === 'dark' ? '#6b7280' : '#8a8a8a';
  const textColor = theme === 'dark' ? '#6b7280' : '#919191';
  const lineOpacity = theme === 'dark' ? 0.6 : 0.4;
  const losOpacity = theme === 'dark' ? 0.9 : 0.7;
  const textOpacity = theme === 'dark' ? 0.5 : 0.3;

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      setDimensions({ width, height });
      
      if (onDimensionsChange) {
        onDimensionsChange(width, height);
      }
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [onDimensionsChange]);

  // Helper function to convert feet coordinates to web pixel coordinates
  const feetToWebPixels = (feetX: number, feetY: number) => {
    if (!dimensions.width || !dimensions.height) return { x: 0, y: 0 };
    
    const scale = dimensions.width / FIELD_WIDTH_FEET;
    const pixelX = feetX * scale;
    // Flip Y axis: feet Y=0 is at bottom, web pixel Y=0 is at top
    const pixelY = dimensions.height - (feetY * scale);
    
    return { x: pixelX, y: pixelY };
  };

  // Calculate how many feet are visible vertically
  const scale = dimensions.width ? dimensions.width / FIELD_WIDTH_FEET : 1;
  const heightInFeet = dimensions.height / scale;

  // Generate field markers procedurally based on visible height
  const fieldMarkers: React.ReactNode[] = [];
  
  // Calculate how many yards we can show
  const maxYards = Math.ceil(heightInFeet / HASH_SPACING);
  
  for (let yard = 0; yard <= maxYards; yard++) {
    const yPositionFeet = yard * HASH_SPACING;
    const isYardLine = yard % 5 === 0;
    const isLineOfScrimmage = yPositionFeet === LINE_OF_SCRIMMAGE;

    // Convert to web pixels
    const y = feetToWebPixels(0, yPositionFeet).y;

    if (isYardLine) {
      // Full yard line - make 5-yard lines more visible
      fieldMarkers.push(
        <line
          key={`yard-${yard}`}
          x1={0}
          y1={y}
          x2={dimensions.width}
          y2={y}
          stroke={isLineOfScrimmage ? losLineColor : lineColor}
          strokeWidth={isLineOfScrimmage ? 1.5 : 1}
          opacity={isLineOfScrimmage ? losOpacity : 0.7}
        />
      );

      // Show hashtag markers at 10-yard intervals
      if (yard % 10 === 0 && yPositionFeet > 0) {
        const leftNumberX = feetToWebPixels(NUMBER_FROM_EDGE + NUMBER_HEIGHT / 2, 0).x;
        fieldMarkers.push(
          <text
            key={`label-left-${yard}`}
            x={leftNumberX}
            y={y}
            fontSize={NUMBER_HEIGHT * scale}
            fill={textColor}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-90 ${leftNumberX} ${y})`}
            opacity={textOpacity}
          >
            #  #
          </text>
        );

        const rightNumberX = feetToWebPixels(FIELD_WIDTH_FEET - NUMBER_FROM_EDGE - NUMBER_HEIGHT / 2, 0).x;
        fieldMarkers.push(
          <text
            key={`label-right-${yard}`}
            x={rightNumberX}
            y={y}
            fontSize={NUMBER_HEIGHT * scale}
            fill={textColor}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(90 ${rightNumberX} ${y})`}
            opacity={textOpacity}
          >
            #  #
          </text>
        );
      }
    } else {
      // Hash marks only (not full yard lines) - make them thicker and more visible
      const leftHashStart = feetToWebPixels(LEFT_HASH_CENTER - HASH_WIDTH / 2, 0).x;
      const leftHashEnd = feetToWebPixels(LEFT_HASH_CENTER + HASH_WIDTH / 2, 0).x;
      
      fieldMarkers.push(
        <line
          key={`left-hash-${yard}`}
          x1={leftHashStart}
          y1={y}
          x2={leftHashEnd}
          y2={y}
          stroke={lineColor}
          strokeWidth={0.6}
          opacity={0.8}
        />
      );

      const rightHashStart = feetToWebPixels(RIGHT_HASH_CENTER - HASH_WIDTH / 2, 0).x;
      const rightHashEnd = feetToWebPixels(RIGHT_HASH_CENTER + HASH_WIDTH / 2, 0).x;
      
      fieldMarkers.push(
        <line
          key={`right-hash-${yard}`}
          x1={rightHashStart}
          y1={y}
          x2={rightHashEnd}
          y2={y}
          stroke={lineColor}
          strokeWidth={0.6}
          opacity={0.8}
        />
      );
    }
  }

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: fieldBg,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {fieldMarkers}
        </svg>
      )}
    </div>
  );
}