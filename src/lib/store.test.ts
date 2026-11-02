import { beforeEach, describe, expect, it } from "vitest";
import { useWard } from "./store";
import { parseBackup } from "./backup";

const patient = { name: 'Pacient test', bed: '1', fo: '123', diagnosis: 'Test', admitted:'2026-11-01' };
function addPatient() {
  useWard.getState().addPatient(patient);
  const p = useWard.getState().patients[0];
  if (!p) throw new Error('missing patient');
  return p;
}
beforeEach(()=>{localStorage.clear();useWard.setState({patients:[],activity:[],favorites:[]});});
describe('ward activity', () => {
  it('records patient addition, discharge date edits and discharge with before/after values', () => {
    const p = addPatient();
    useWard.getState().updatePatient(p.id,{discharge:'2026-11-03'});
    useWard.getState().updatePatient(p.id,{dischargedAt:'2026-11-02'});
    expect(useWard.getState().activity.map(e=>e.action)).toEqual(['patientAdded','patientUpdated','patientDischarged']);
    expect(useWard.getState().activity[1]?.changes).toEqual([{field:'discharge',before:'',after:'2026-11-03'}]);
  });
  it('records task addition, status/date changes, removal and patient removal', () => {
    const p=addPatient();
    useWard.getState().addTask(p.id,{kind:'investigation',label:'RMN cerebral',key:'img-rmn-cerebral',contrast:true,status:'pending'});
    const task=useWard.getState().patients[0]?.tasks[0];
    if (!task) throw new Error('missing task');
    useWard.getState().updateTask(p.id,task.id,{status:'scheduled',date:'2026-11-03'});
    useWard.getState().removeTask(p.id,task.id);
    useWard.getState().removePatient(p.id);
    expect(useWard.getState().activity.map(e=>e.action)).toEqual(['patientAdded','taskAdded','taskUpdated','taskRemoved','patientRemoved']);
    expect(useWard.getState().activity[2]?.changes).toEqual([{field:'status',before:'pending',after:'scheduled'},{field:'date',before:'',after:'2026-11-03'}]);
    expect(useWard.getState().activity[4]?.patientName).toBe('Pacient test');
  });
  it('does not log unchanged or nonexistent updates',()=>{
    const p=addPatient();
    useWard.getState().updatePatient(p.id,{name:p.name});
    useWard.getState().updatePatient('missing',{name:'Other'});
    expect(useWard.getState().activity).toHaveLength(1);
  });
  it('persists favorites and activity across rehydration',async()=>{
    addPatient();useWard.getState().toggleFavorite('doppler');
    const saved=localStorage.getItem('ward-board-v1');
    if (!saved) throw new Error('not persisted');
    useWard.setState({patients:[],favorites:[],activity:[]});
    localStorage.setItem('ward-board-v1',saved);
    await useWard.persist.rehydrate();
    expect(useWard.getState().favorites).toEqual(['doppler']);
    expect(useWard.getState().activity[0]?.action).toBe('patientAdded');
  });
  it('preserves legacy task keys and existing history when importing old backups',()=>{
    const p=addPatient();useWard.getState().toggleFavorite('doppler');
    const old={...p,tasks:[{id:'old',key:'ct',kind:'investigation',label:'CT',status:'pending'}]};
    const data=parseBackup([old]);useWard.getState().replaceAll(data.patients,data);
    expect(useWard.getState().patients[0]?.tasks[0]?.key).toBe('ct');
    expect(useWard.getState().activity.map(e=>e.action)).toEqual(['patientAdded','backupImported']);
    expect(useWard.getState().favorites).toEqual(['doppler']);
  });
  it('round trips new backups including favorites and journal without duplicating events',()=>{
    addPatient();useWard.getState().toggleFavorite('doppler');
    const s=useWard.getState();const data=parseBackup(JSON.parse(JSON.stringify({patients:s.patients,activity:s.activity,favorites:s.favorites})));
    useWard.getState().replaceAll(data.patients,data);
    expect(useWard.getState().favorites).toEqual(['doppler']);
    expect(useWard.getState().activity).toHaveLength(2);
  });
  it('rejects malformed patient and activity backups',()=>{
    expect(()=>parseBackup([{name:'broken'}])).toThrow();
    expect(()=>parseBackup({patients:[],favorites:[],activity:[{action:'invented'}]})).toThrow();
  });
});