"use client";

interface PokerChipWrapperProps {
  value: number;
}

// Custom poker chip component that matches the design from the image
// Uses the same CSS classes that are already in globals.css
export default function PokerChipWrapper({ value }: PokerChipWrapperProps) {
  // Determine chip color based on value (matching the image)
  const getChipColor = (val: number) => {
    if (val === 1) return "#9ca3af"; // Light gray
    if (val === 5) return "#7f1d1d"; // Dark red (maroon)
    if (val === 10) return "#1e3a8a"; // Dark blue
    if (val === 25) return "#14532d"; // Dark green
    if (val === 100) return "#000000"; // Black
    return "#666666"; // Default gray
  };

  const getChipLineColor = (val: number) => {
    if (val === 1) return "#d1d5db"; // Lighter gray
    if (val === 5) return "#991b1b"; // Lighter red
    if (val === 10) return "#1e40af"; // Lighter blue
    if (val === 25) return "#166534"; // Lighter green
    if (val === 100) return "#333333"; // Dark gray
    return "#888888"; // Default
  };

  const color = getChipColor(value);
  const lineColor = getChipLineColor(value);
  const size = 50; // Smaller chips for better fit in the layout
  const sizeScale = size / 151; // Scale factor for proportional scaling

  // Darken function
  const darken = (col: string, percent: number) => {
    // Simple darken for hex colors
    if (col.startsWith("#")) {
      const num = parseInt(col.replace("#", ""), 16);
      const r = Math.max(
        0,
        Math.min(
          255,
          ((num >> 16) & 0xff) - (((num >> 16) & 0xff) * percent) / 100
        )
      );
      const g = Math.max(
        0,
        Math.min(
          255,
          ((num >> 8) & 0xff) - (((num >> 8) & 0xff) * percent) / 100
        )
      );
      const b = Math.max(
        0,
        Math.min(255, (num & 0xff) - ((num & 0xff) * percent) / 100)
      );
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
    return col;
  };

  const outerColor = darken(color, 25);
  const innerLineColor = darken(lineColor, 8);
  const innerLineGapColor = darken(color, 32);

  // Scale gradient positions based on chip size
  const scalePos = (pos: number) => (pos * size) / 151;

  const outerBg1 = scalePos(67.5);
  const outerBg2 = scalePos(83.5);
  const outerBg3 = scalePos(97.4304);
  const outerBg4 = scalePos(113.4304);

  const innerBg1 = scalePos(69.5);
  const innerBg2 = scalePos(81.5);
  const innerBg3 = scalePos(98.7104);
  const innerBg4 = scalePos(110.7104);

  const outerBackgroundImage = `linear-gradient(0deg, transparent 0, transparent ${outerBg1}px, ${lineColor} ${outerBg1}px, ${lineColor} ${outerBg2}px, transparent ${outerBg2}px, transparent ${size}px), linear-gradient(60deg, transparent 0, transparent ${outerBg3}px, ${lineColor} ${outerBg3}px, ${lineColor} ${outerBg4}px, transparent ${outerBg4}px, transparent ${size}px), linear-gradient(120deg, ${outerColor} 0, ${outerColor} ${outerBg3}px, ${lineColor} ${outerBg3}px, ${lineColor} ${outerBg4}px, ${outerColor} ${outerBg4}px, ${outerColor} ${size}px)`;

  const innerBackgroundImage = `linear-gradient(0deg, transparent 0, transparent ${innerBg1}px, ${innerLineColor} ${innerBg1}px, ${innerLineColor} ${innerBg2}px, transparent ${innerBg2}px, transparent ${size}px), linear-gradient(30deg, transparent 0, transparent ${innerBg3}px, ${innerLineColor} ${innerBg3}px, ${innerLineColor} ${innerBg4}px, transparent ${innerBg4}px, transparent ${size}px), linear-gradient(60deg, transparent 0, transparent ${innerBg3}px, ${innerLineColor} ${innerBg3}px, ${innerLineColor} ${innerBg4}px, transparent ${innerBg4}px, transparent ${size}px), linear-gradient(90deg, transparent 0, transparent ${innerBg1}px, ${innerLineColor} ${innerBg1}px, ${innerLineColor} ${innerBg2}px, transparent ${innerBg2}px, transparent ${size}px), linear-gradient(120deg, transparent 0, transparent ${innerBg3}px, ${innerLineColor} ${innerBg3}px, ${innerLineColor} ${innerBg4}px, transparent ${innerBg4}px, transparent ${size}px), linear-gradient(150deg, ${innerLineGapColor} 0, ${innerLineGapColor} ${innerBg3}px, ${innerLineColor} ${innerBg3}px, ${innerLineColor} ${innerBg4}px, ${innerLineGapColor} ${innerBg4}px, ${innerLineGapColor} ${size}px)`;

  const getFontSize = (val: string) => {
    // Scale font size based on chip size
    const baseSize = size / 151;
    if (val.length === 4) return `${48 * baseSize}px`;
    if (val.length === 5) return `${39 * baseSize}px`;
    if (val.length === 6) return `${32 * baseSize}px`;
    return `${50 * baseSize}px`;
  };

  const valueText = `$${value}`;
  const fontSize = getFontSize(valueText);

  return (
    <div className="pokerchip" style={{ width: size, height: size }}>
      <div
        className="pokerchipOuter"
        style={{
          backgroundImage: outerBackgroundImage,
          width: `${size}px`,
          height: `${size}px`,
          backgroundSize: `${size}px ${size}px`,
        }}
      >
        <div
          className="innerChipBorder"
          style={{
            backgroundImage: innerBackgroundImage,
            border: `${8 * sizeScale}px solid ${outerColor}`,
            width: `${117 * sizeScale}px`,
            height: `${117 * sizeScale}px`,
            top: `${9 * sizeScale}px`,
            left: `${9 * sizeScale}px`,
            backgroundSize: `${size}px ${size}px`,
          }}
        />
        <div
          className="chipContent"
          style={{
            background: outerColor,
            color: innerLineGapColor,
            fontSize: fontSize,
            width: `${111 * sizeScale}px`,
            height: `${111 * sizeScale}px`,
            top: `${20 * sizeScale}px`,
            left: `${20 * sizeScale}px`,
            lineHeight: `${111 * sizeScale}px`,
          }}
        >
          {valueText}
        </div>
      </div>
    </div>
  );
}
