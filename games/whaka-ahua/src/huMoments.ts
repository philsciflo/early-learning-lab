import { InkMask } from "./rasterMask.ts";
import { Point } from "./triangleScoring.ts";

/** Raw (un-centred) image moments up to 3rd order: M_pq = sum over ink
 * pixels of x^p * y^q. The building block for both the centroid and
 * (indirectly, via the central moments below) the Hu invariants. */
export type RawMoments = {
  m00: number;
  m10: number;
  m01: number;
  m20: number;
  m11: number;
  m02: number;
  m30: number;
  m21: number;
  m12: number;
  m03: number;
};

/** Central moments mu_pq, up to 3rd order, computed about the shape's
 * own centroid - translation-invariant by construction. mu10/mu01 are
 * always ~0 at the centroid and aren't needed by anything downstream,
 * so they're omitted here. */
export type CentralMoments = {
  mu00: number;
  mu20: number;
  mu11: number;
  mu02: number;
  mu30: number;
  mu21: number;
  mu12: number;
  mu03: number;
};

/** Scale-invariant normalized central moments eta_pq, derived from the
 * 2nd/3rd order central moments - the direct input to the Hu
 * invariants below. */
export type NormalizedCentralMoments = {
  eta20: number;
  eta11: number;
  eta02: number;
  eta30: number;
  eta21: number;
  eta12: number;
  eta03: number;
};

/** The 7 classical Hu (1962) moment invariants, in phi1..phi7 order -
 * invariant (up to small numerical/rasterization error) under
 * translation, scaling and rotation of the underlying shape. */
export type HuMomentVector = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type HuMomentsResult = {
  rawMoments: RawMoments;
  centralMoments: CentralMoments;
  centroid: Point;
  huMoments: HuMomentVector;
};

// Below this, an ink mask's 0th raw/central moment (its ink pixel
// count) is treated as "no shape here" rather than risking a
// division that produces NaN/Infinity further down the pipeline.
const DEGENERATE_M00_EPSILON = 1e-6;

/** Sums x^p * y^q over every ink pixel, for every (p, q) up to 3rd
 * order - the shared starting point for the centroid and (via the
 * central moments) every Hu invariant. Exported mainly so a
 * standalone verification script can inspect intermediate values
 * directly rather than only the final Hu vector. */
export function computeRawMoments(mask: InkMask): RawMoments {
  const { width, height, ink } = mask;
  let m00 = 0,
    m10 = 0,
    m01 = 0,
    m20 = 0,
    m11 = 0,
    m02 = 0,
    m30 = 0,
    m21 = 0,
    m12 = 0,
    m03 = 0;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const y2 = y * y;
    for (let x = 0; x < width; x++) {
      if (ink[rowOffset + x] !== 1) {
        continue;
      }
      const x2 = x * x;
      m00 += 1;
      m10 += x;
      m01 += y;
      m20 += x2;
      m11 += x * y;
      m02 += y2;
      m30 += x2 * x;
      m21 += x2 * y;
      m12 += x * y2;
      m03 += y2 * y;
    }
  }

  return { m00, m10, m01, m20, m11, m02, m30, m21, m12, m03 };
}

/** Central moments about `centroid`, computed by directly re-summing
 * (x - xbar)^p * (y - ybar)^q over every ink pixel - simplest and
 * least error-prone option, even though it costs a second full pass
 * over the mask rather than deriving mu_pq algebraically from the raw
 * moments. */
export function computeCentralMoments(
  mask: InkMask,
  centroid: Point,
): CentralMoments {
  const { width, height, ink } = mask;
  let mu00 = 0,
    mu20 = 0,
    mu11 = 0,
    mu02 = 0,
    mu30 = 0,
    mu21 = 0,
    mu12 = 0,
    mu03 = 0;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const dy = y - centroid.y;
    const dy2 = dy * dy;
    for (let x = 0; x < width; x++) {
      if (ink[rowOffset + x] !== 1) {
        continue;
      }
      const dx = x - centroid.x;
      const dx2 = dx * dx;
      mu00 += 1;
      mu20 += dx2;
      mu11 += dx * dy;
      mu02 += dy2;
      mu30 += dx2 * dx;
      mu21 += dx2 * dy;
      mu12 += dx * dy2;
      mu03 += dy2 * dy;
    }
  }

  return { mu00, mu20, mu11, mu02, mu30, mu21, mu12, mu03 };
}

/** Normalizes the central moments into scale-invariant eta_pq, per the
 * standard eta_pq = mu_pq / mu00^((p+q)/2 + 1) definition (same one
 * OpenCV's cv::Moments uses internally ahead of cv::HuMoments - see
 * completeMomentState() in opencv/modules/imgproc/src/moments.cpp). */
export function computeNormalizedCentralMoments(
  central: CentralMoments,
): NormalizedCentralMoments {
  const { mu00 } = central;
  const normalize = (muPq: number, order: number): number =>
    muPq / Math.pow(mu00, order / 2 + 1);

  return {
    eta20: normalize(central.mu20, 2),
    eta11: normalize(central.mu11, 2),
    eta02: normalize(central.mu02, 2),
    eta30: normalize(central.mu30, 3),
    eta21: normalize(central.mu21, 3),
    eta12: normalize(central.mu12, 3),
    eta03: normalize(central.mu03, 3),
  };
}

/** The 7 classical Hu moment invariants, computed from the normalized
 * central moments.
 *
 * Formulas verified directly against OpenCV's implementation
 * (`cv::HuMoments` in opencv/modules/imgproc/src/moments.cpp, the
 * `void cv::HuMoments(const Moments& m, double hu[7])` overload),
 * algebraically expanded here from OpenCV's factored/optimized form
 * into the explicit phi1..phi7 form so each term reads directly
 * against the standard reference (Hu, M.K., "Visual Pattern
 * Recognition by Moment Invariants", IRE Transactions on Information
 * Theory, 1962) - the same formulas reproduced in, eg, the Wikipedia
 * "Image moment" article. The two were cross-checked term-by-term
 * before trusting either. */
export function computeHuInvariants(
  eta: NormalizedCentralMoments,
): HuMomentVector {
  const { eta20, eta11, eta02, eta30, eta21, eta12, eta03 } = eta;

  // Shared sub-expressions, named after their role in the standard
  // formulas (eg "s" for the eta30+eta12-style symmetric sum, "d" for
  // the eta30-3*eta12-style antisymmetric difference).
  const s30_12 = eta30 + eta12;
  const s21_03 = eta21 + eta03;
  const d30_12 = eta30 - 3 * eta12;
  const d21_03 = 3 * eta21 - eta03;

  const phi1 = eta20 + eta02;
  const phi2 = Math.pow(eta20 - eta02, 2) + 4 * eta11 * eta11;
  const phi3 = d30_12 * d30_12 + d21_03 * d21_03;
  const phi4 = s30_12 * s30_12 + s21_03 * s21_03;
  const phi5 =
    d30_12 * s30_12 * (s30_12 * s30_12 - 3 * s21_03 * s21_03) +
    d21_03 * s21_03 * (3 * s30_12 * s30_12 - s21_03 * s21_03);
  const phi6 =
    (eta20 - eta02) * (s30_12 * s30_12 - s21_03 * s21_03) +
    4 * eta11 * s30_12 * s21_03;
  const phi7 =
    d21_03 * s30_12 * (s30_12 * s30_12 - 3 * s21_03 * s21_03) -
    d30_12 * s21_03 * (3 * s30_12 * s30_12 - s21_03 * s21_03);

  return [phi1, phi2, phi3, phi4, phi5, phi6, phi7];
}

/** The three OpenCV cv2.matchShapes() comparison distances between two
 * Hu-moment vectors - I1/I2/I3 correspond to OpenCV's CONTOURS_MATCH_I1/
 * I2/I3. All three are computed (rather than only the default I1) so
 * all are available for inspection. Lower = more similar; 0 for
 * identical shapes (up to rasterization noise). */
export type MatchShapesResult = {
  i1: number;
  i2: number;
  i3: number;
};

// Guards against log10(0)/division-by-zero below - cv2.matchShapes
// itself skips a term outright when a Hu moment's magnitude is this
// small (see opencv/modules/imgproc/src/shapedescr.cpp), rather than
// letting a near-zero invariant blow up the comparison.
const MATCH_SHAPES_EPSILON = 1e-5;

/** Sign-aware log10 transform of a single Hu invariant, per OpenCV's
 * cv2.matchShapes: m_i = sign(h_i) * log10(|h_i|). |h_i| at or below
 * MATCH_SHAPES_EPSILON maps to m_i = 0 (flagged as no contribution
 * by the caller) rather than letting log10 produce -Infinity/NaN. */
function logTransformHuMoment(h: number): number {
  if (Math.abs(h) <= MATCH_SHAPES_EPSILON) {
    return 0;
  }
  return Math.sign(h) * Math.log10(Math.abs(h));
}

/** OpenCV's cv2.matchShapes() distance between two Hu-moment vectors,
 * computed via all three of OpenCV's methods. Each m_i below is the
 * log-transformed Hu invariant i (see logTransformHuMoment() above). */
export function computeMatchShapes(
  huA: HuMomentVector,
  huB: HuMomentVector,
): MatchShapesResult {
  let i1 = 0;
  let i2 = 0;
  let i3 = 0;

  for (let i = 0; i < 7; i++) {
    const mA = logTransformHuMoment(huA[i]);
    const mB = logTransformHuMoment(huB[i]);

    // I1(A,B) = sum |1/m_i^A - 1/m_i^B| - OpenCV's default for
    // cv2.matchShapes. Skips the term if either side is a guarded
    // (near-)zero, since its reciprocal would be unbounded.
    if (mA !== 0 && mB !== 0) {
      i1 += Math.abs(1 / mA - 1 / mB);
    }

    // I2(A,B) = sum |m_i^A - m_i^B|.
    i2 += Math.abs(mA - mB);

    // I3(A,B) = max_i |(m_i^A - m_i^B) / m_i^A|. Skips the term if the
    // reference side is a guarded (near-)zero.
    if (mA !== 0) {
      i3 = Math.max(i3, Math.abs((mA - mB) / mA));
    }
  }

  return { i1, i2, i3 };
}

/** End-to-end entry point: rasterized ink mask in, 7 Hu invariants (plus
 * the intermediate moments/centroid, for debugging) out - or `null` for
 * a degenerate (near-empty) mask rather than NaN/Infinity propagating
 * into a downstream score. */
export function computeHuMoments(mask: InkMask): HuMomentsResult | null {
  const rawMoments = computeRawMoments(mask);
  if (rawMoments.m00 < DEGENERATE_M00_EPSILON) {
    return null;
  }

  const centroid: Point = {
    x: rawMoments.m10 / rawMoments.m00,
    y: rawMoments.m01 / rawMoments.m00,
  };
  const centralMoments = computeCentralMoments(mask, centroid);
  const normalizedCentralMoments =
    computeNormalizedCentralMoments(centralMoments);
  const huMoments = computeHuInvariants(normalizedCentralMoments);

  return { rawMoments, centralMoments, centroid, huMoments };
}
