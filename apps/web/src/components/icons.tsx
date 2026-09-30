/** Ícones em SVG inline (sem biblioteca externa); herdam a cor do texto. */
type IconProps = { size?: number };

const svgProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const BackIcon = ({ size = 22 }: IconProps) => <svg {...svgProps(size)}><path d="M15 18l-6-6 6-6" /></svg>;
export const CloseIcon = ({ size = 18 }: IconProps) => <svg {...svgProps(size)}><path d="M18 6L6 18M6 6l12 12" /></svg>;
export const EditIcon = ({ size = 15 }: IconProps) => <svg {...svgProps(size)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>;
export const CheckCircleIcon = ({ size = 22 }: IconProps) => <svg {...svgProps(size)}><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.5 2.5L16 9.5" /></svg>;
export const UndoIcon = ({ size = 20 }: IconProps) => <svg {...svgProps(size)}><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" /></svg>;
export const PlusIcon = ({ size = 16 }: IconProps) => <svg {...svgProps(size)}><path d="M12 5v14M5 12h14" /></svg>;
export const MinusIcon = ({ size = 16 }: IconProps) => <svg {...svgProps(size)}><path d="M5 12h14" /></svg>;
export const CartIcon = ({ size = 24 }: IconProps) => (
  <svg {...svgProps(size)}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.7 12.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L22 7H6" /></svg>
);
