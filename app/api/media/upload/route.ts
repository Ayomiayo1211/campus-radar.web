import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin,toCamelCase} from '@/lib/server/supabase';
import {requireRole} from '@/lib/server/auth';
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
 const form=await request.formData();const file=form.get('file');
 if(!(file instanceof File))return NextResponse.json({error:'No image file provided'},{status:400});
 if(!file.size)return NextResponse.json({error:'The image file is empty'},{status:400});
 if(file.size>MAX_FILE_SIZE)return NextResponse.json({error:'Image must be 10MB or smaller'},{status:400});
 const format=ALLOWED_TYPES[file.type];if(!format)return NextResponse.json({error:'Only JPEG, PNG, WebP and GIF images are allowed'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());if(detectImageFormat(bytes)!==format)return NextResponse.json({error:'The file content does not match a supported image type'},{status:400});
 const db=getSupabaseAdmin();const path=`images/${crypto.randomUUID()}.${format}`;
 const {error:uploadError}=await db.storage.from('campus-radar-media').upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
 if(uploadError){console.error('Supabase Storage upload failed:',uploadError.message);return NextResponse.json({error:'Image upload failed. Please try again.'},{status:502});}
 const {data:publicData}=db.storage.from('campus-radar-media').getPublicUrl(path);const publicUrl=publicData.publicUrl;
 const {data,error}=await db.from('media').insert({public_id:path,url:publicUrl,secure_url:publicUrl,resource_type:'image',format,bytes:file.size,original_name:file.name.slice(0,255),folder:'campus-radar'}).select('*').single();
 if(error||!data){await db.storage.from('campus-radar-media').remove([path]);console.error('Could not save media metadata:',error?.message);return NextResponse.json({error:'Could not save uploaded image'},{status:500});}
 return NextResponse.json({data:toCamelCase(data)},{status:201});
}
