import fs from 'node:fs';
import {seed,defaultSettings} from '../app/model.ts';
const first=seed();first.deadline='2026-09-13';
fs.writeFileSync(new URL('../public/club.json',import.meta.url),JSON.stringify({version:1,revision:1,weeks:[first],settings:defaultSettings},null,2)+'\n');
