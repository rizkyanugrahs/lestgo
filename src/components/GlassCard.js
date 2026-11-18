export default function GlassCard({ className = "", children, ...rest }) {
  return (
    <div className={"glass rounded-2xl p-4 " + className} {...rest}>
      {children}
    </div>
  );
}
