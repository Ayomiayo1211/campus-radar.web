import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin,toCamelCase} from '@/lib/server/supabase';
import {requireRole} from '@/lib/server/auth';
import {getCloudinaryCredentials,signCloudinaryParams} from '@/lib/server/cloudinary-rest';
const MAX_FILE_SIZE=10*1024*1024;
const ALLOWED_TYPES:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
function detectImageFormat(bytes:Uint8Array):string|null{
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'jpg';
 if(bytes.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i)=>bytes[i]===v))return 'png';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';
 if(bytes.length>=6&&['GIF87a','GIF89a'].includes(String.fromCharCode(...bytes.slice(0,6))))return 'gif';
 return null;
}
export async function POST(request:NextRequest){
 try{await requireRole(['SUPER_ADMIN','EDITOR','REPORTER']);}catch(error){const forbidden=error instanceof Error&&error.message==='Forbidden';return NextResponse.json({error:forbidden?'You do not have permission to upload media':'Authentication required'},{status:forbidden?403:401});}
 try{
  const form=await request.formData();const file=form.get('file');
  if(!(file instanceof File))return NextResponse.json({error:'No image file provided'},{status:400});
  if(!file.size)return NextResponse.json({error:'The image file is empty'},{status:400});
  if(file.size>MAX_FILE_SIZE)return NextResponse.json({error:'Image must be 10MB or smaller'},{status:400});
  const expected=ALLOWED_TYPES[file.type];if(!expected)return NextResponse.json({error:'Only JPEG, PNG, WebP and GIF images are allowed'},{status:400});
  const bytes=new Uint8Array(await file.arrayBuffer());const actual=detectImageFormat(bytes);
  if(!actual||actual!==expected)return NextResponse.json({error:'The file content does not match a supported image type'},{status:400});
  const {cloudName,apiKey,apiSecret}=getCloudinaryCredentials();const timestamp=Math.floor(Date.now()/1000).toString();
  const params={folder:'campus-radar',timestamp};const signature=await signCloudinaryParams(params,apiSecret);
  const payload=new FormData();payload.set('file',new Blob([bytes],{type:file.type}),file.name);payload.set('api_key',apiKey);payload.set('timestamp',timestamp);payload.set('folder','campus-radar');payload.set('signature',signature);
  const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,{method:'POST',body:payload});
  const uploaded=await response.json() as {public_id?:string;url?:string;secure_url?:string;resource_type?:string;format?:string;width?:number;height?:number;bytes?:number;error?:{message?:string}};
  if(!response.ok||!uploaded.public_id||!uploaded.secure_url){console.error('Cloudinary upload failed',uploaded.error?.message||response.status);return NextResponse.json({error:'Image upload failed. Please try again.'},{status:502});}
  const {data,error}=await getSupabaseAdmin().from('media').insert({public_id:uploaded.public_id,url:uploaded.url||uploaded.secure_url,secure_url:uploaded.secure_url,resource_type:uploaded.resource_type||'image',format:uploaded.format||actual,width:uploaded.width??null,height:uploaded.height??null,bytes:uploaded.bytes??file.size,original_name:file.name.slice(0,255),folder:'campus-radar'}).select('*').single();
  if(error||!data)throw new Error('Cloudinary upload succeeded but media metadata could not be saved');
  return NextResponse.json({data:toCamelCase(data)},{status:201});
 }catch(error){console.error('Media upload failed:',error);return NextResponse.json({error:'Image upload failed. Please try again.'},{status:500});}
}
