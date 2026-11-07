/** @param {{x:number,y:number,z:number}} location @param {number} [inset] */
export function blockOutlineBounds(location, inset = 0.06) {
  const extent = Math.max(0, 0.5 - inset);
  return {
    center: { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 },
    extent: { x: extent, y: extent, z: extent },
  };
}

/** @param {{center:{x:number,y:number,z:number},extent:{x:number,y:number,z:number}}} bounds @param {number} [inset] */
export function outlineMarkerLocations(bounds, inset = 0) {
  const half = {
    x: Math.max(0, bounds.extent.x - inset),
    y: Math.max(0, bounds.extent.y - inset),
    z: Math.max(0, bounds.extent.z - inset),
  };
  const low = {
    x: bounds.center.x - half.x,
    y: bounds.center.y - half.y,
    z: bounds.center.z - half.z,
  };
  const high = {
    x: bounds.center.x + half.x,
    y: bounds.center.y + half.y,
    z: bounds.center.z + half.z,
  };
  const middle = bounds.center;
  const points = [];
  for (const x of [low.x, high.x]) {
    for (const y of [low.y, high.y]) {
      for (const z of [low.z, high.z]) points.push({ x, y, z });
    }
  }
  for (const x of [low.x, high.x]) {
    for (const y of [low.y, high.y]) points.push({ x, y, z: middle.z });
  }
  for (const x of [low.x, high.x]) {
    for (const z of [low.z, high.z]) points.push({ x, y: middle.y, z });
  }
  for (const y of [low.y, high.y]) {
    for (const z of [low.z, high.z]) points.push({ x: middle.x, y, z });
  }
  return points;
}

/** @param {{x:number,y:number,z:number}} point */
export function perceptionMarkerKey(point) {
  return point.x.toFixed(3) + "," + point.y.toFixed(3) + "," + point.z.toFixed(3);
}
