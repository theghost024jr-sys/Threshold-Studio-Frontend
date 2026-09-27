import FlowerCanvas from './FlowerCanvas';
import DriftPanel from './DriftPanel';
import ResonancePanel from './ResonancePanel';
import PressurePanel from './PressurePanel';
import EchoRail from './EchoRail';

export default function PortalApp() {
  return (
    <div className="portal-container">
      <FlowerCanvas />
      <div className="portal-panels">
        <DriftPanel />
        <ResonancePanel />
        <PressurePanel />
      </div>
      <EchoRail />
    </div>
  );
}
