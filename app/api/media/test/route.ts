import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/server/auth';
import {pingCloudinary} from '@/lib/server/cloudinary-rest';
export async function GET(){try{await requireRole(['SUPER_ADMIN']);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}try{const result=await pingCloudinary();return NextResponse.json({success:true,status:result.status??'ok'});}catch(error){console.error('Cloudinary connection failed:',error);return NextResponse.json({success:false,error:'Cloudinary connection failed'},{status:503});}}
