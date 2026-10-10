import { TabBar } from '../../components';
import { Art,Card,Frame,Heading,useCarNavigation } from './shared';
import { useAppData } from '../../integration/AppData';
import { useCarSession } from './session';
export type CarCheckProps={carName?:string;numberPlate?:string;findingCount?:number;lastChecked?:string;reportSummary?:string};
export function CarCheck({carName='Perodua Myvi',numberPlate='WXY 4821',findingCount=2,lastChecked='3 days ago',reportSummary='Rear bumper scratch, drive belt squeal'}:CarCheckProps){
  const go=useCarNavigation();const data=useAppData();const car=data.selectedCar;const session=useCarSession();
  const displayName=car?`${car.make} ${car.model}`:carName;const plate=car?.plate??numberPlate;
  const results=[...(session.dashboard?.findings??[]),...(session.startup?[{label:session.startup.verdict}]:[])];
  const count=results.length||findingCount;
  const summary=results.length?results.map(result=>result.label).join(', '):reportSummary;
  const checked=session.dashboard?.at??session.startup?.at;
  const checkedLabel=checked?'just now':session.loadingReport?'Loading…':lastChecked;
  return <Frame className="car-overview" footer={<TabBar active="Car" onChange={tab=>{if(tab!=='Car')go(tab==='Home'?'/drive/home':'/'+tab.toLowerCase());}}/>}>
    <Heading title="Car check">{displayName} · {plate}</Heading><div className="car-overview-art"><Art name="ae49e.svg"/></div>
    <section className="car-checks" aria-label="Checks"><Card title="Dashboard scan" description="Explains a warning light or temperature gauge" icon="d16b0.svg" asideInHeading aside={<span className="text-label-small car-duration">1 min</span>} chevron onClick={()=>go('first-check')}/><Card title="Start-up sound check" description="Listens for a slow crank that may mean a weak battery" icon="14172.svg" asideInHeading aside={<span className="text-label-small car-duration">15 sec</span>} chevron onClick={()=>go('engine-sound-check')}/></section>
    <section className="car-last-report"><h2 className="text-body-strong">Latest report</h2><Card title={`${count} ${count===1?'thing':'things'} to check`} description={summary} icon="dea3d.svg" asideInHeading aside={<span className="text-label-small car-duration">{checkedLabel}</span>} chevron onClick={()=>go('car-report')}/></section>
  </Frame>;
}
