// Bezel height profiles: f(x) where x ∈ [0,1] is the distance from the outer
// edge of the glass towards the flat interior, and f(x) ∈ [0,1] is the height.

export const CONVEX_CIRCLE = (x) => Math.sqrt(1 - (1 - x) ** 2);

export const CONVEX = (x) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4); // squircle

export const CONCAVE = (x) => 1 - CONVEX_CIRCLE(x);

export const LIP = (x) => {
  const convex = CONVEX(x * 2);
  const concave = CONCAVE(x) + 0.1;
  const smootherstep = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  return convex * (1 - smootherstep) + concave * smootherstep;
};

export const SURFACES = {
  convex: CONVEX,
  circle: CONVEX_CIRCLE,
  concave: CONCAVE,
  lip: LIP,
};
