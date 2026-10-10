// Sample dashboard artwork exported from the Figma "Scan a warning light" frame (142:1445).
// Layer insets are copied from the design; each vector is an exported asset.
const layers: [string, string | null, string][] = [
  ['11.2% 45.56% 21.6% 7.78%','-0.6%','3a716'],
  ['64.04% 82.25% 33.12% 15.78%','-17.61%','517ba'],
  ['53.2% 86.86% 45.56% 10.5%','-40.33% -13.16%','06334'],
  ['39.92% 87.56% 59.44% 9.72%','-78.14% -12.76%','ad164'],
  ['26.48% 84.17% 71.2% 13.58%','-21.55% -15.43%','29cfc'],
  ['17% 77.47% 79.44% 21.28%','-14.05% -27.78%','56c52'],
  ['13.6% 68.89% 82.4% 31.11%','-12.5% -1.25px','e6835'],
  ['17% 59.06% 79.44% 39.69%','-14.05% -27.78%','3b077'],
  ['26.48% 51.36% 71.2% 46.39%','-21.55% -15.43%','b3e7f'],
  ['39.92% 47.5% 59.44% 49.78%','-78.14% -12.76%','ee7f7'],
  ['53.2% 48.28% 45.56% 49.08%','-40.33% -13.16%','a216f'],
  ['64.04% 53.56% 33.12% 44.47%','-17.61%','6341c'],
  ['44.8% 68.89% 38.24% 19.33%','-3.54%','d2d90'],
  ['42.4% 67.22% 52.8% 29.44%',null,'3dbec'],
  ['20% 8.33% 30.4% 57.22%','-0.81%','b9e53'],
  ['25.63% 16.14% 61.76% 61.92%','-6.34% -2.53%','153ef'],
  ['31.24% 13.03% 61.76% 83.86%','-14.29% -22.33% -14.29% -22.32%','98666'],
  ['34.24% 15.08% 55.2% 74.44%','-5.68% -3.98%','c99f5'],
  ['42.8% 24.17% 53.2% 73.06%',null,'5aeb6'],
  ['79.6% 24.44% 12% 21.67%','-4.76% -0.52%','b0218'],
  ['77.2% 37.78% 10.17% 55.56%','-3.17% -4.17%','5d7fe'],
];
export function DashboardSample() {
  return <div className="dashboard-sample" aria-hidden="true">
    <img src="/assets/car/dash/bg.svg" alt="" className="dashboard-sample__bg" />
    {layers.map(([inset, inner, name]) => inner
      ? <span key={name} className="dashboard-sample__layer" style={{ inset }}><span className="dashboard-sample__inner" style={{ inset: inner }}><img src={'/assets/car/dash/' + name + '.svg'} alt="" /></span></span>
      : <span key={name} className="dashboard-sample__layer" style={{ inset }}><img src={'/assets/car/dash/' + name + '.svg'} alt="" className="dashboard-sample__fill" /></span>)}
  </div>;
}
