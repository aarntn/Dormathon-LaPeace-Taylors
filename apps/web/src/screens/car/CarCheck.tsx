import { TabBar } from '../../components';
import { Art,Card,Frame,Heading,useCarNavigation } from './shared';
export type CarCheckProps={carName?:string;numberPlate?:string;findingCount?:number;lastChecked?:string;reportSummary?:string};
export function CarCheck({carName='Perodua Myvi',numberPlate='WXY 4821',findingCount=2,lastChecked='3 days ago',reportSummary='Rear bumper scratch, drive belt squeal'}:CarCheckProps){
  const go=useCarNavigation();
  return <Frame className="car-overview" footer={<TabBar active="Car" onChange={tab=>{if(tab!=='Car')go(tab==='Home'?'/drive/home':'/'+tab.toLowerCase());}}/>}>
    <Heading title="Car check">{carName} · {numberPlate}</Heading><div className="car-overview-art"><Art name="ae49e.svg"/></div>
    <section className="car-checks" aria-label="Checks"><Card title="Photo walk-around" description="Finds scratches, dents, worn tyres and warning lights" icon="d16b0.svg" asideInHeading aside={<span className="text-label-small car-duration">3 min</span>} chevron onClick={()=>go('first-check')}/><Card title="Engine sound check" description="Listens for belt squeal, misfires and knocking" icon="14172.svg" asideInHeading aside={<span className="text-label-small car-duration">15 sec</span>} chevron onClick={()=>go('engine-sound-check')}/></section>
    <section className="car-last-report"><h2 className="text-body-strong">Last report</h2><Card title={`${findingCount} things to check`} description={reportSummary} icon="dea3d.svg" asideInHeading aside={<span className="text-label-small car-duration">{lastChecked}</span>} chevron onClick={()=>go('car-report')}/></section>
  </Frame>;
}
