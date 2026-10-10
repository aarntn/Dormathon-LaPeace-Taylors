/** A trace of recorded coordinates; no invented map tiles or route data. */
export function RouteTrace({points}:{points:[number,number][]}){
 if(points.length<2)return <p className="live-summary-map live-summary-map--empty text-body-small">Not enough location points for a route trace.</p>;
 const lat=points.map(p=>p[0]),lng=points.map(p=>p[1]);const loX=Math.min(...lng),loY=Math.min(...lat);
 const dx=Math.max(...lng)-loX,dy=Math.max(...lat)-loY;const span=Math.max(dx*Math.cos(lat[0]*Math.PI/180),dy,0.00001);
 const path=points.map(([y,x])=>[(x-loX)*Math.cos(lat[0]*Math.PI/180)/span*260+20,160-(y-loY)/span*130].join(',')).join(' ');
 return <figure className="catch-card"><svg viewBox="0 0 300 180" role="img" aria-label="Recorded trip route"><polyline points={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/></svg><figcaption className="text-label-small">Recorded route trace</figcaption></figure>;
}
