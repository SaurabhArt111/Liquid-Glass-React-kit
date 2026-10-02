import { LiquidGlass } from "../LiquidGlass.jsx";
import { LiquidIconButton } from "./LiquidIconButton.jsx";

/**
 * Mobile top bar. Controls float as glass (a round leading button, a grouped
 * trailing pill) while the title stays plain text between them — like iOS 26.
 *
 *   leading:  { icon, label, onClick }
 *   trailing: [{ icon, label, onClick }, …]   (1 → round button, 2+ → one pill)
 */
export function LiquidTopNav({ title, leading, trailing = [], width = 366, height = 48, className = "", style }) {
  const actions = Array.isArray(trailing) ? trailing : [trailing];
  const slot = height - 4;
  return (
    <header className={`lg-topnav ${className}`} style={{ width, height, ...style }}>
      <div className="lg-topnav-side">
        {leading && <LiquidIconButton size={height} icon={leading.icon} label={leading.label} onClick={leading.onClick} />}
      </div>
      <h2 className="lg-topnav-title">{title}</h2>
      <div className="lg-topnav-side lg-topnav-side--end">
        {actions.length === 1 && (
          <LiquidIconButton size={height} icon={actions[0].icon} label={actions[0].label} onClick={actions[0].onClick} />
        )}
        {actions.length > 1 && (
          <LiquidGlass
            width={actions.length * slot + 10}
            height={height}
            bezelWidth={Math.round(height * 0.45)}
            glassThickness={72}
            blur={0.2}
            tint={0.14}
            refraction={1}
            restRefraction={0.75}
            specularOpacity={0.8}
            shadow={1.4}
            restScale={1}
            activeScale={1}
            jelly={0}
            glow={0}
            role="toolbar"
          >
            <div className="lg-topnav-group">
              {actions.map((a, i) => (
                <button key={i} type="button" className="lg-topnav-btn" style={{ width: slot, height: slot }} aria-label={a.label} onClick={a.onClick}>
                  {a.icon}
                </button>
              ))}
            </div>
          </LiquidGlass>
        )}
      </div>
    </header>
  );
}
