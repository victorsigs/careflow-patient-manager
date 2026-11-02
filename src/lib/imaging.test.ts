import { describe, expect, it } from "vitest";
import { IMAGING, MODALITIES, filterImaging, imagingTask } from "./imaging";
import { INVESTIGATIONS } from "./ward-data";

describe("requested imaging catalog", () => {
  it("includes all ten requested modalities", () => {
    expect(MODALITIES).toEqual(['Radiografie','Ecografie','Doppler','CT','Angio-CT','RMN','Angio-RMN','PET-CT','SPECT-CT','Mamografie']);
    for (const m of MODALITIES) expect(IMAGING.some(i=>i.modality === m)).toBe(true);
  });
  it("retains Eco Doppler in specialty imaging and removes generic radiology presets", () => {
    expect(IMAGING.find(i=>i.key === 'doppler')).toMatchObject({ ro:'Eco Doppler', modality:'Doppler', region:'Imagistică de specialitate' });
    for (const key of ['ct','angioct','mri','rx','eco','ecocord']) expect(INVESTIGATIONS.some(i=>i.key === key)).toBe(false);
    expect(INVESTIGATIONS.some(i=>i.key === 'hlg')).toBe(true);
  });
  it("deduplicates repeated RMN cerebral, Galactografie and Radiografie mandibulă", () => {
    for (const ro of ['RMN cerebral','Galactografie','Radiografie mandibulă']) expect(IMAGING.filter(i=>i.ro === ro)).toHaveLength(1);
    expect(new Set(IMAGING.map(i=>i.key)).size).toBe(IMAGING.length);
  });
  it("filters modality and anatomical region with accent-insensitive search", () => {
    expect(filterImaging([], 'cervicala', 'CT','Coloană vertebrală').map(i=>i.ro)).toEqual(['CT coloană cervicală']);
    expect(filterImaging([], '', 'Mamografie','Sân')).toHaveLength(9);
  });
  it("places selected favorites first", () => {
    const chosen = IMAGING.find(i=>i.ro === 'RMN whole-body');
    expect(chosen).toBeDefined();
    if (!chosen) throw new Error('missing investigation');
    expect(filterImaging([chosen.key])[0]?.key).toBe(chosen.key);
    expect(filterImaging([])[0]?.key).not.toBe(chosen.key);
  });
  it("offers contrast variants for RMN only", () => {
    const mri = IMAGING.find(i=>i.ro === 'RMN cerebral');
    const ct = IMAGING.find(i=>i.ro === 'CT cerebral');
    if (!mri || !ct) throw new Error('missing investigations');
    expect(imagingTask(mri,true)).toMatchObject({contrast:true,label:'RMN cerebral'});
    expect(imagingTask(mri,false)).toMatchObject({contrast:false});
    expect(imagingTask(ct,true)).not.toHaveProperty('contrast');
  });
});