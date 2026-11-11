/** A backdrop with enough detail for refraction to be visible. Pure CSS: no image requests. */
export function Stage({ variant = "aurora", className = "", stageRef, children, ...rest }) {
  return (
    <div ref={stageRef} className={`stage stage--${variant} ${className}`} {...rest}>
      {variant === "text" && (
        <div className="stage-words" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i}>refraction · snell · bezel · glass · displacement · </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
