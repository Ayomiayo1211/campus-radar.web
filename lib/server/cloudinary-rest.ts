export type CloudinaryCredentials = { cloudName: string; apiKey: string; apiSecret: string };
export function getCloudinaryCredentials(): CloudinaryCredentials {
  const value=process.env.CLOUDINARY_URL;
  if(!value)throw new Error('Cloudinary is not configured');
  const parsed=new URL(value);
  if(parsed.protocol!=='cloudinary:')throw new Error('Invalid Cloudinary configuration');
  const credentials={cloudName:parsed.hostname,apiKey:decodeURIComponent(parsed.username),apiSecret:decodeURIComponent(parsed.password)};
  if(!credentials.cloudName||!credentials.apiKey||!credentials.apiSecret)throw new Error('Incomplete Cloudinary configuration');
  return credentials;
}
function toHex(buffer:ArrayBuffer){return Array.from(new Uint8Array(buffer),byte=>byte.toString(16).padStart(2,'0')).join('');}
export async function signCloudinaryParams(params:Record<string,string>,apiSecret:string){
 const canonical=Object.keys(params).sort().map(key=>`${key}=${params[key]}`).join('&');
 const digest=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(canonical+apiSecret));
 return toHex(digest);
}
export async function pingCloudinary(){
 const {cloudName,apiKey,apiSecret}=getCloudinaryCredentials();
 const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/ping`,{headers:{Authorization:`Basic ${btoa(`${apiKey}:${apiSecret}`)}`}});
 if(!response.ok)throw new Error(`Cloudinary ping returned HTTP ${response.status}`);
 return response.json() as Promise<{status?:string}>;
}
