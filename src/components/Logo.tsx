/** App logo: the custom LestGo logo image in a rounded container. */
export default function Logo({ size = 64 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="LestGo"
      width={size}
      height={size}
      className="object-cover shadow-lg shadow-wine-900/30"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    />
  );
}
