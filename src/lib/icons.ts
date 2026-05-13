/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const ICON_COLORS: Record<string, string> = {
  blue: "#4F7CFF",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  purple: "#A855F7",
  fuschia: "#D946EF",
  pink: "#EC4899",
  rose: "#F43F5E",
  red: "#EF4444",
  orange: "#F97316",
  amber: "#F59E0B",
  yellow: "#EAB308",
  lime: "#84CC16",
  green: "#22C55E",
  emerald: "#10B981",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  sky: "#0EA5E9",
  slate: "#64748B",
  stone: "#78716C",
  zinc: "#71717A",
};

export const SHAPES_LIST = [
  "circle", "square", "sharp_square", "triangle", "hexagon", 
  "octagon", "diamond", "star", "shield", "drop", 
  "capsule", "squircle", "rhombus", "pentagon", "cross", 
  "cloud", "ring", "arch", "wave", "heart"
];

export function updateAppMeta(color: string, shape: string) {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
  const manifest = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  const themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;

  if (favicon) favicon.href = `/api/icon?color=${color}&shape=${shape}&size=32`;
  if (appleIcon) appleIcon.href = `/api/icon?color=${color}&shape=${shape}&size=180&format=png`;
  if (manifest) manifest.href = `/api/manifest.json?color=${color}&shape=${shape}`;
  if (themeColor) themeColor.content = ICON_COLORS[color] || ICON_COLORS.blue;
  
  localStorage.setItem('zenScanIconColor', color);
  localStorage.setItem('zenScanIconShape', shape);
}
