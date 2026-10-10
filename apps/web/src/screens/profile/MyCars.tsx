import {Button} from '../../components';
import {Frame,Heading} from './shared';
import {useAppData} from '../../integration/AppData';
import {AccountNotice} from '../../integration/AccountNotice';
import {useProfileNavigation} from './shared';
export function MyCars(){
 const d=useAppData();const go=useProfileNavigation();
 return <Frame back="/profile/profile" footer={<Button label="Add a car" onClick={()=>go('/profile/add-a-car')}/>}><Heading title="My cars">BUCKL keeps checks and trips separate for each car.</Heading><AccountNotice/>
 {d.cars.length===0?<p className="text-body-small">No cars saved yet.</p>:d.cars.map(c=><article key={c.id} className="profile-garage-card profile-panel"><h2 className="text-body-strong">{c.make} {c.model}</h2><p className="text-body-small">{[c.plate,c.year,c.colour].filter(Boolean).join(' · ')}</p><Button style="Secondary" label={d.selectedCar?.id===c.id?'Driving this car':'Switch to this car'} disabled={d.selectedCar?.id===c.id} onClick={()=>d.selectCar(c.id)}/></article>)}</Frame>;
}
