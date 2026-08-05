import kpLogo from "@/assets/kp-logo.png.asset.json";

export function KpMark({ size = 48 }: { size?: number }) {
  return (
    <img
      src={kpLogo.url}
      alt="KP Farm Ventures logo"
      width={size}
      height={size}
      className="rounded-full"
      style={{ width: size, height: size }}
    />
  );
}
