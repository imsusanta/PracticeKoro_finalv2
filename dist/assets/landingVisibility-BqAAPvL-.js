import{c as s}from"./index-DSmop-7Y.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=s("PowerOff",[["path",{d:"M18.36 6.64A9 9 0 0 1 20.77 15",key:"dxknvb"}],["path",{d:"M6.16 6.16a9 9 0 1 0 12.68 12.68",key:"1x7qb5"}],["path",{d:"M12 2v4",key:"3427ic"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=s("Power",[["path",{d:"M12 2v10",key:"mnfbl"}],["path",{d:"M18.4 6.6a9 9 0 1 1-12.77.04",key:"obofu9"}]]),o="practicekoro_landing_visibility",e=()=>{try{const t=localStorage.getItem(o);if(t)return JSON.parse(t)}catch(t){console.error("Error reading landing visibility:",t)}return{exams:{},tests:{}}},a=t=>{try{localStorage.setItem(o,JSON.stringify(t))}catch(i){console.error("Error saving landing visibility:",i)}},l=t=>e().exams[t]===!0,d=t=>{const i=e(),n=!i.exams[t];return i.exams[t]=n,a(i),n},y=t=>e().tests[t]===!0,f=t=>{const i=e(),n=!i.tests[t];return i.tests[t]=n,a(i),n};export{c as P,g as a,y as b,f as c,l as i,d as t};
