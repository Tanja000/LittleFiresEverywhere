/**
 * @license
 * author: Deta
 * deta@1.2.0
 * Released under the MIT license.
 */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).deta={})}(this,(function(e){"use strict";
/*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */var t=function(){return(t=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};function r(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{u(n.next(e))}catch(e){i(e)}}function a(e){try{u(n.throw(e))}catch(e){i(e)}}function u(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}u((n=n.apply(e,t||[])).next())}))}function n(e,t){var r,n,o,i,s={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function a(i){return function(a){return function(i){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return s.label++,{value:i[1],done:!1};case 5:s.label++,n=i[1],i=[0];continue;case 7:i=s.ops.pop(),s.trys.pop();continue;default:if(!(o=s.trys,(o=o.length>0&&o[o.length-1])||6!==i[0]&&2!==i[0])){s=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){s.label=i[1];break}if(6===i[0]&&s.label<o[1]){s.label=o[1],o=i;break}if(o&&s.label<o[2]){s.label=o[2],s.ops.push(i);break}o[2]&&s.ops.pop(),s.trys.pop();continue}i=t.call(e,s)}catch(e){i=[6,e],n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,a])}}}var o={BASE:"https://:host/v1/:project_id/:base_name",DRIVE:"https://:host/v1/:project_id/:drive_name"};var i,s,a={base:function(e){var t=(null==e?void 0:e.trim())||(null===""?void 0:"".trim())||"database.deta.sh";return o.BASE.replace(":host",t)},drive:function(e){var t=(null==e?void 0:e.trim())||(null===""?void 0:"".trim())||"drive.deta.sh";return o.DRIVE.replace(":host",t)}};!function(e){e[e.AuthToken=0]="AuthToken",e[e.ProjectKey=1]="ProjectKey"}(i||(i={})),function(e){e.Put="PUT",e.Get="GET",e.Post="POST",e.Patch="PATCH",e.Delete="DELETE"}(s||(s={}));var u=function(){function e(e,t,r){this.requestConfig={baseURL:r,headers:t===i.AuthToken?{Authorization:e}:{"X-API-Key":e}}}return e.prototype.put=function(o,i){return r(this,void 0,void 0,(function(){return n(this,(function(r){return[2,e.fetch(o,t(t({},this.requestConfig),{body:i,method:s.Put}))]}))}))},e.prototype.delete=function(o,i){return r(this,void 0,void 0,(function(){return n(this,(function(r){return[2,e.fetch(o,t(t({},this.requestConfig),{body:i,method:s.Delete}))]}))}))},e.prototype.get=function(o,i){return r(this,void 0,void 0,(function(){return n(this,(function(r){return[2,e.fetch(o,t(t({},this.requestConfig),{method:s.Get,blobResponse:null==i?void 0:i.blobResponse}))]}))}))},e.prototype.post=function(o,i){return r(this,void 0,void 0,(function(){return n(this,(function(r){return[2,e.fetch(o,t(t({},this.requestConfig),{body:i.payload,method:s.Post,headers:t(t({},this.requestConfig.headers),i.headers)}))]}))}))},e.prototype.patch=function(o,i){return r(this,void 0,void 0,(function(){return n(this,(function(r){return[2,e.fetch(o,t(t({},this.requestConfig),{body:i,method:s.Patch}))]}))}))},e.fetch=function(e,o){var i,s;return r(this,void 0,void 0,(function(){var r,a,u,c,l,p,d,f;return n(this,(function(n){switch(n.label){case 0:return n.trys.push([0,7,,8]),r=o.body instanceof Uint8Array?o.body:JSON.stringify(o.body),a=(null===(i=null==o?void 0:o.headers)||void 0===i?void 0:i["Content-Type"])||"application/json",u=t(t({},o.headers),{"Content-Type":a}),[4,fetch(""+o.baseURL+e,{body:r,headers:u,method:o.method})];case 1:return(c=n.sent()).ok?[3,3]:[4,c.json()];case 2:return l=n.sent(),p=(null===(s=null==l?void 0:l.errors)||void 0===s?void 0:s[0])||"Something went wrong",[2,{status:c.status,error:new Error(p)}];case 3:return o.blobResponse?[4,c.blob()]:[3,5];case 4:return d=n.sent(),[2,{status:c.status,response:d}];case 5:return[4,c.json()];case 6:return f=n.sent(),[2,{status:c.status,response:f}];case 7:return n.sent(),[2,{status:500,error:new Error("Something went wrong")}];case 8:return[2]}}))}))},e}(),c={PUT_ITEMS:"/items",QUERY_ITEMS:"/query",INSERT_ITEMS:"/items",GET_ITEMS:"/items/:key",PATCH_ITEMS:"/items/:key",DELETE_ITEMS:"/items/:key"},l={GET_FILE:"/files/download?name=:name",DELETE_FILES:"/files",LIST_FILES:"/files?prefix=:prefix&recursive=:recursive&limit=:limit&last=:last",INIT_CHUNK_UPLOAD:"/uploads?name=:name",UPLOAD_FILE_CHUNK:"/uploads/:uid/parts?name=:name&part=:part",COMPLETE_FILE_UPLOAD:"/uploads/:uid?name=:name"};function p(e){return"[object Object]"===Object.prototype.toString.call(e)}var d,f=function(){function e(e){this.date=e||new Date}return e.prototype.addSeconds=function(e){return this.date=new Date(this.date.getTime()+1e3*e),this},e.prototype.getEpochSeconds=function(){return Math.floor(this.date.getTime()/1e3)},e}();function h(e){return"number"==typeof e}!function(e){e.Set="set",e.Trim="trim",e.Increment="increment",e.Append="append",e.Prepend="prepend"}(d||(d={}));var v=function(e,t){this.operation=e,this.value=t};function y(e){return null==e}var m=function(){function e(){}return e.prototype.trim=function(){return new v(d.Trim)},e.prototype.increment=function(e){return void 0===e&&(e=1),new v(d.Increment,e)},e.prototype.append=function(e){return new v(d.Append,Array.isArray(e)?e:[e])},e.prototype.prepend=function(e){return new v(d.Prepend,Array.isArray(e)?e:[e])},e}();function w(e,t){return y(e)&&y(t)?{}:y(e)||y(t)?y(e)?h(t)||t instanceof Date?t instanceof Date?{ttl:new f(t).getEpochSeconds()}:{ttl:t}:{error:new Error("option expireAt should have a value of type number or Date")}:h(e)?{ttl:(new f).addSeconds(e).getEpochSeconds()}:{error:new Error("option expireIn should have a value of type number")}:{error:new Error("can't set both expireIn and expireAt options")}}var E="__expires",b=function(){function e(e,t,r,n,o){var i=a.base(o).replace(":base_name",n).replace(":project_id",r);this.requests=new u(e,t,i),this.util=new m}return e.prototype.put=function(e,o,i){var s,a;return r(this,void 0,void 0,(function(){var r,u,l,d,f,h,v,m;return n(this,(function(n){switch(n.label){case 0:if(r=w(null==i?void 0:i.expireIn,null==i?void 0:i.expireAt),u=r.ttl,l=r.error)throw l;return d=[t(t(t({},p(e)?e:{value:e}),o&&{key:o}),!y(u)&&(m={},m[E]=u,m))],[4,this.requests.put(c.PUT_ITEMS,{items:d})];case 1:if(f=n.sent(),h=f.response,v=f.error)throw v;return[2,(null===(a=null===(s=null==h?void 0:h.processed)||void 0===s?void 0:s.items)||void 0===a?void 0:a[0])||null]}}))}))},e.prototype.get=function(e){return r(this,void 0,void 0,(function(){var t,r,o,i,s,a;return n(this,(function(n){switch(n.label){case 0:if(!(t=null==e?void 0:e.trim()))throw new Error("Key is empty");return r=encodeURIComponent(t),[4,this.requests.get(c.GET_ITEMS.replace(":key",r))];case 1:if(o=n.sent(),i=o.status,s=o.response,(a=o.error)&&404!==i)throw a;return 200===i?[2,s]:[2,null]}}))}))},e.prototype.delete=function(e){return r(this,void 0,void 0,(function(){var t,r,o;return n(this,(function(n){switch(n.label){case 0:if(!(t=null==e?void 0:e.trim()))throw new Error("Key is empty");return r=encodeURIComponent(t),[4,this.requests.delete(c.DELETE_ITEMS.replace(":key",r))];case 1:if(o=n.sent().error)throw o;return[2,null]}}))}))},e.prototype.insert=function(e,o,i){return r(this,void 0,void 0,(function(){var r,s,a,u,l,d,f,h,v;return n(this,(function(n){switch(n.label){case 0:if(r=w(null==i?void 0:i.expireIn,null==i?void 0:i.expireAt),s=r.ttl,a=r.error)throw a;return u=t(t(t({},p(e)?e:{value:e}),o&&{key:o}),!y(s)&&((v={})[E]=s,v)),[4,this.requests.post(c.INSERT_ITEMS,{payload:{item:u}})];case 1:if(l=n.sent(),d=l.status,f=l.response,(h=l.error)&&409===d)throw new Error("Item with key "+o+" already exists");if(h)throw h;return[2,f]}}))}))},e.prototype.putMany=function(e,o){return r(this,void 0,void 0,(function(){var r,i,s,a,u,l,d;return n(this,(function(n){switch(n.label){case 0:if(!(e instanceof Array))throw new Error("Items must be an array");if(!e.length)throw new Error("Items can't be empty");if(e.length>25)throw new Error("We can't put more than 25 items at a time");if(r=w(null==o?void 0:o.expireIn,null==o?void 0:o.expireAt),i=r.ttl,s=r.error)throw s;return a=e.map((function(e){var r,n=p(e)?e:{value:e};return t(t({},n),!y(i)&&((r={})[E]=i,r))})),[4,this.requests.put(c.PUT_ITEMS,{items:a})];case 1:if(u=n.sent(),l=u.response,d=u.error)throw d;return[2,l]}}))}))},e.prototype.update=function(e,o,i){return r(this,void 0,void 0,(function(){var r,s,a,u,l,p,f,h;return n(this,(function(n){switch(n.label){case 0:if(!(r=null==o?void 0:o.trim()))throw new Error("Key is empty");if(s=w(null==i?void 0:i.expireIn,null==i?void 0:i.expireAt),a=s.ttl,u=s.error)throw u;return l={set:t({},!y(a)&&(h={},h[E]=a,h)),increment:{},append:{},prepend:{},delete:[]},Object.entries(e).forEach((function(e){var t=e[0],r=e[1],n=r instanceof v?r:new v(d.Set,r),o=n.operation,i=n.value;switch(o){case d.Trim:l.delete.push(t);break;default:l[o][t]=i}})),p=encodeURIComponent(r),[4,this.requests.patch(c.PATCH_ITEMS.replace(":key",p),l)];case 1:if(f=n.sent().error)throw f;return[2,null]}}))}))},e.prototype.fetch=function(e,t){return void 0===e&&(e=[]),r(this,void 0,void 0,(function(){var r,o,i,s,a,u,l,p,d,f,h,v,y,m,w;return n(this,(function(n){switch(n.label){case 0:return o=(r=t||{}).limit,i=void 0===o?1e3:o,s=r.last,a=void 0===s?"":s,u=r.desc,l=void 0!==u&&u?"desc":"",p={query:Array.isArray(e)?e:[e],limit:i,last:a,sort:l},[4,this.requests.post(c.QUERY_ITEMS,{payload:p})];case 1:if(d=n.sent(),f=d.response,h=d.error)throw h;return v=f.items,y=f.paging,m=y.size,w=y.last,[2,{items:v,count:m,last:w}]}}))}))},e}();function T(){return"undefined"!=typeof process&&null!=process.versions&&null!=process.versions.node}var I=function(){function e(e,t,r,n,o){var i=a.drive(o).replace(":drive_name",n).replace(":project_id",r);this.requests=new u(e,t,i)}return e.prototype.get=function(e){return r(this,void 0,void 0,(function(){var t,r,o,i,s,a;return n(this,(function(n){switch(n.label){case 0:if(!(t=null==e?void 0:e.trim()))throw new Error("Name is empty");return r=encodeURIComponent(t),[4,this.requests.get(l.GET_FILE.replace(":name",r),{blobResponse:!0})];case 1:if(o=n.sent(),i=o.status,s=o.response,a=o.error,404===i&&a)return[2,null];if(a)throw a;return[2,s]}}))}))},e.prototype.delete=function(e){var t;return r(this,void 0,void 0,(function(){var r,o,i,s;return n(this,(function(n){switch(n.label){case 0:if(!(null==e?void 0:e.trim()))throw new Error("Name is empty");return r={names:[e]},[4,this.requests.delete(l.DELETE_FILES,r)];case 1:if(o=n.sent(),i=o.response,s=o.error)throw s;return[2,(null===(t=null==i?void 0:i.deleted)||void 0===t?void 0:t[0])||e]}}))}))},e.prototype.deleteMany=function(e){return r(this,void 0,void 0,(function(){var t,r,o,i,s;return n(this,(function(n){switch(n.label){case 0:if(!e.length)throw new Error("Names can't be empty");if(e.length>1e3)throw new Error("We can't delete more than 1000 items at a time");return t={names:e},[4,this.requests.delete(l.DELETE_FILES,t)];case 1:if(r=n.sent(),o=r.status,i=r.response,s=r.error,400===o&&s)throw new Error("Names can't be empty");if(s)throw s;return[2,i]}}))}))},e.prototype.list=function(e){return r(this,void 0,void 0,(function(){var t,r,o,i,s,a,u,c,p,d,f,h;return n(this,(function(n){switch(n.label){case 0:return r=(t=e||{}).recursive,o=void 0===r||r,i=t.prefix,s=void 0===i?"":i,a=t.limit,u=void 0===a?1e3:a,c=t.last,p=void 0===c?"":c,[4,this.requests.get(l.LIST_FILES.replace(":prefix",s).replace(":recursive",o.toString()).replace(":limit",u.toString()).replace(":last",p))];case 1:if(d=n.sent(),f=d.response,h=d.error)throw h;return[2,f]}}))}))},e.prototype.put=function(e,t){return r(this,void 0,void 0,(function(){var r,o,i,s,a,u,c;return n(this,(function(n){switch(n.label){case 0:if(!(r=null==e?void 0:e.trim()))throw new Error("Name is empty");if(o=encodeURIComponent(r),t.path&&t.data)throw new Error("Please only provide data or a path. Not both");if(!t.path&&!t.data)throw new Error("Please provide data or a path. Both are empty");if(t.path&&!T())throw new Error("Can't use path in browser environment");return i=new Uint8Array,t.path?[4,require("fs").promises.readFile(t.path)]:[3,2];case 1:s=n.sent(),i=new Uint8Array(s),n.label=2;case 2:if(t.data)if(T()&&t.data instanceof Buffer)i=function(e){for(var t=new Uint8Array(e.length),r=0;r<e.length;r+=1)t[r]=e[r];return t}(t.data);else if("string"==typeof(l=t.data)||l instanceof String)i=function(e){for(var t=new Uint8Array(e.length),r=0;r<e.length;r+=1)t[r]=e.charCodeAt(r);return t}(t.data);else{if(!(t.data instanceof Uint8Array))throw new Error("Unsupported data format, expected data to be one of: string | Uint8Array | Buffer");i=t.data}return[4,this.upload(o,i,t.contentType||"binary/octet-stream")];case 3:if(a=n.sent(),u=a.response,c=a.error)throw c;return[2,u]}var l}))}))},e.prototype.upload=function(e,t,o){return r(this,void 0,void 0,(function(){var r,i,s,a,u,c,p,d,f,h,v,y,m,w;return n(this,(function(n){switch(n.label){case 0:return r=t.byteLength,i=10485760,[4,this.requests.post(l.INIT_CHUNK_UPLOAD.replace(":name",e),{headers:{"Content-Type":o}})];case 1:if(s=n.sent(),a=s.response,u=s.error)return[2,{error:u}];c=a.upload_id,p=a.name,d=1,f=0,n.label=2;case 2:return f<r?(h=f,v=Math.min(f+i,r),y=t.slice(h,v),[4,this.requests.post(l.UPLOAD_FILE_CHUNK.replace(":uid",c).replace(":name",e).replace(":part",d.toString()),{payload:y,headers:{"Content-Type":o}})]):[3,5];case 3:if(m=n.sent().error)return[2,{error:m}];d+=1,n.label=4;case 4:return f+=i,[3,2];case 5:return[4,this.requests.patch(l.COMPLETE_FILE_UPLOAD.replace(":uid",c).replace(":name",e))];case 6:return(w=n.sent().error)?[2,{error:w}]:[2,{response:p}]}}))}))},e}(),g=function(){function e(e,t,r){this.key=e,this.type=t,this.projectId=r}return e.prototype.Base=function(e,t){var r=null==e?void 0:e.trim();if(!r)throw new Error("Base name is not defined");return new b(this.key,this.type,this.projectId,r,t)},e.prototype.Drive=function(e,t){var r=null==e?void 0:e.trim();if(!r)throw new Error("Drive name is not defined");return new I(this.key,this.type,this.projectId,r,t)},e}();function _(e,t){var r=null==t?void 0:t.trim(),n=null==e?void 0:e.trim();if(r&&n)return new g(r,i.AuthToken,n);var o=n||(null===""?void 0:"".trim());if(!o)throw new Error("Project key is not defined");return new g(o,i.ProjectKey,o.split("_")[0])}e.Base=function(e,t){return _().Base(e,t)},e.Deta=_,e.Drive=function(e,t){return _().Drive(e,t)},Object.defineProperty(e,"__esModule",{value:!0})}));
